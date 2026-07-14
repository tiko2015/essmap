import { Client } from 'pg';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import {
    bootstrap,
    DefaultJobQueuePlugin,
    TransactionalConnection,
    ConfigService,
    RequestContextService,
    User,
    RequestContext,
    LanguageCode,
    FacetService,
    FacetValueService,
    SlugService,
    ChannelService,
    CurrencyCode,
    Populator,
    AssetService,
} from '@vendure/core';
import { Country } from '@vendure/core/dist/entity/region/country.entity';
import { Province } from '@vendure/core/dist/entity/region/province.entity';
import { RegionTranslation } from '@vendure/core/dist/entity/region/region-translation.entity';
import { config } from '../../vendure-config';
import { initialData } from '../initial-data';
import { provinces } from '../listado-province';
import { Organization } from '../../plugins/organizations/entities/organization.entity';
import { OrganizationAddress } from '../../plugins/organizations/entities/organization-address.entity';
import { OrganizationBranch } from '../../plugins/organizations/entities/organization-branch.entity';
import { OrganizationType } from '../../plugins/organizations/entities/organization-type.entity';

import 'dotenv/config';

const IMPORT_DIR = __dirname + '/..';

// ── CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const skipBackup = args.includes('--skip-backup');

// ── Helpers ───────────────────────────────────────────────
function log(msg: string) {
    console.log(`[init] ${msg}`);
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function getImageExtension(url: string): string {
    const match = url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'png';
}

async function promptYesNo(question: string): Promise<boolean> {
    if (isForce) return true;
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(`${question} (y/N) `, answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

function getDbConfig() {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: +(process.env.DB_PORT ?? '5432'),
        database: process.env.DB_NAME || 'essapp',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
    };
}

function getProjectRoot(): string {
    return path.resolve(__dirname, '..', '..', '..');
}

async function downloadImage(url: string, dest: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(dest, buffer);
}

// ── Stage 1: DB operations ───────────────────────────────
async function stageCheckAndResetDB() {
    log('Stage 1: Checking database state');

    const db = getDbConfig();

    const pgClient = new Client({
        host: db.host,
        port: db.port,
        database: db.database,
        user: db.user,
        password: db.password,
    });

    await pgClient.connect();

    const result = await pgClient.query(
        `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const tableCount = result.rows[0].cnt;

    if (tableCount === 0) {
        log('Database is empty, no reset needed');
        await pgClient.end();
        return;
    }

    log(`Database has ${tableCount} tables`);

    if (isDryRun) {
        const backupPath = path.resolve(IMPORT_DIR, 'backups', `huemul-dryrun-${Date.now()}.sql`);
        log(`Would: backup to ${backupPath}`);
        log(`Would: DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
        log(`Would: remove all files from static/assets`);
        log(`Would: bootstrap Vendure (synchronize creates tables)`);
        await pgClient.end();
        return;
    }

    const proceed = await promptYesNo('This will destroy all existing data. Continue?');
    if (!proceed) {
        log('Aborted by user');
        await pgClient.end();
        process.exit(0);
    }

    if (!skipBackup) {
        const backupDir = path.resolve(IMPORT_DIR, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.resolve(backupDir, `huemul-${timestamp}.sql`);

        log(`Backing up to ${backupPath}...`);
        const dockerComposeDir = getProjectRoot();

        const pgDumpResult = spawnSync(
            'docker-compose',
            [
                'exec', '-T', 'database',
                'pg_dump',
                '-U', db.user,
                '-d', db.database,
            ],
            {
                cwd: dockerComposeDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
                maxBuffer: 50 * 1024 * 1024,
            }
        );

        if (pgDumpResult.status !== 0) {
            const stderr = pgDumpResult.stderr?.toString() || 'unknown error';
            log(`Backup failed: ${stderr}`);
            await pgClient.end();
            process.exit(1);
        }

        fs.writeFileSync(backupPath, pgDumpResult.stdout);
        log(`Backup saved (${(pgDumpResult.stdout.length / 1024 / 1024).toFixed(1)} MB)`);
    } else {
        log('Skipping backup (--skip-backup)');
    }

    log('Resetting database schema...');
    await pgClient.query('DROP SCHEMA public CASCADE');
    await pgClient.query('CREATE SCHEMA public');
    log('Database schema reset complete');

    // Clean up assets so asset IDs start fresh
    const assetsDir = path.resolve(getProjectRoot(), 'static', 'assets');
    if (fs.existsSync(assetsDir)) {
        const entries = fs.readdirSync(assetsDir);
        for (const entry of entries) {
            const fullPath = path.join(assetsDir, entry);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        log(`Cleaned ${entries.length} entries from static/assets`);
    }

    await pgClient.end();
}

// ── Stage 2: Bootstrap ───────────────────────────────────
async function stageBootstrap() {
    log('Stage 2: Bootstrapping Vendure');

    const initConfig = {
        ...config,
        plugins: (config.plugins || []).filter(
            plugin => plugin !== DefaultJobQueuePlugin,
        ),
    };

    const app = await bootstrap(initConfig);
    log('Vendure bootstrapped successfully');
    return app;
}

// ── Stage 3: Context ─────────────────────────────────────
async function getSuperadminContext(app: any): Promise<RequestContext> {
    const { superadminCredentials } = app.get(ConfigService).authOptions;
    const superAdminUser = await app.get(TransactionalConnection)
        .getRepository(User)
        .findOneOrFail({ where: { identifier: superadminCredentials.identifier } });
    return app.get(RequestContextService).create({
        apiType: 'admin',
        user: superAdminUser,
    });
}

// ── Stage 4: Populate initial data ───────────────────────
async function stagePopulateInitialData(app: any, ctx: RequestContext) {
    log('Stage 4: Populating initial data (countries, zones, tax rates, roles)');

    const populator = app.get(Populator);
    await populator.populateInitialData(initialData);

    log('Initial data populated');

    const channelService = app.get(ChannelService);
    await channelService.update(ctx, {
        id: 1,
        currencyCode: CurrencyCode.ARS,
        defaultCurrencyCode: CurrencyCode.ARS,
        availableCurrencyCodes: [CurrencyCode.ARS],
        pricesIncludeTax: true,
    });
    log('Default channel currency set to ARS');
}

// ── Stage 5: Import provinces ────────────────────────────
async function stageImportProvinces(ctx: RequestContext, app: any) {
    log('Stage 5: Importing provinces');

    const connection = app.get(TransactionalConnection);
    const countryRepo = connection.getRepository(ctx, Country);
    const provinceRepo = connection.getRepository(ctx, Province);
    const translationRepo = connection.getRepository(ctx, RegionTranslation);

    const argentina = await countryRepo.findOne({ where: { code: 'AR' } });
    if (!argentina) throw new Error('Country Argentina (AR) not found');

    let created = 0;
    for (const p of provinces) {
        const existing = await provinceRepo.findOne({
            where: { code: p.key, parentId: argentina.id },
        });
        if (existing) continue;

        const province = await provinceRepo.save({
            code: p.key,
            enabled: true,
            parent: argentina,
            parentId: argentina.id,
            type: 'province',
        } as any);

        await translationRepo.save({
            languageCode: LanguageCode.es,
            name: p.name,
            base: province,
        });

        created++;
    }

    log(`Provinces imported: ${created} created, ${provinces.length - created} already existed`);
}

// ── Stage 8: Import EssApp entities ──────────────────────
interface EnrichedEntidad {
    nid: string;
    nombre: string;
    latitud: string;
    longitud: string;
    tipo: string;
    provincia: string;
    descuentos: string;
    ref_direccion: string;
    direccion: string;
    logo?: string | null;
    subtitulo: string;
    titulo_sede: string;
    logoDetail?: { src: string; alt: string } | null;
    calleCompleta?: string;
    localidad?: string;
    provinciaNombre?: string;
    codPostal?: string;
    telefono?: string;
    web?: string;
    detalle?: string;
    rubro?: string;
    entidadesRel?: string;
}

function parseRubros(rubro: string | undefined): string[] {
    if (!rubro) return [];
    return rubro.split(',').map(part => part.trim().replace(/\|\d+$/, '')).filter(Boolean);
}

function parseEntidadesRel(rel: string | undefined): Array<{ nid: string; name: string }> {
    if (!rel || rel.trim() === '') return [];
    try {
        const cleaned = rel.replace(/([{,])\s*"/g, '$1"').replace(/"\s*:/g, '":');
        const parsed = JSON.parse(cleaned);
        return Object.entries(parsed).map(([nid, name]) => ({ nid, name: String(name) }));
    } catch {
        return [];
    }
}

const PROVINCE_NAME_TO_CODE: Record<string, string> = {};
for (const p of provinces) {
    PROVINCE_NAME_TO_CODE[p.name.toLowerCase()] = p.key;
}

async function stageImportEssApp(ctx: RequestContext, app: any) {
    log('Stage 8: Importing EssApp entities');

    const connection = app.get(TransactionalConnection);
    const jsonPath = path.resolve(IMPORT_DIR, 'entidades.json');
    if (!fs.existsSync(jsonPath)) {
        log('entidades.json not found, skipping EssApp import');
        log('Run npm run fetch:essapp first to download entity data');
        return;
    }

    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const entities: Array<{ node: EnrichedEntidad }> = raw.nodes;
    log(`Loaded ${entities.length} entities from entidades.json`);

    const organizationRepo = connection.getRepository(ctx, Organization);
    const addressRepo = connection.getRepository(ctx, OrganizationAddress);
    const typeRepo = connection.getRepository(ctx, OrganizationType);
    const provinceRepo = connection.getRepository(ctx, Province);
    const assetService = app.get(AssetService);

    const organizationTypes = await typeRepo.save(
        typeRepo.create([
            { name: 'Medios', code: 'medios' },
            { name: 'Universidades', code: 'universidades' },
            { name: 'Ferias', code: 'ferias' },
            { name: 'Cooperativas', code: 'cooperativas' },
        ])
    );
    log('Organization types created');

    // ── Collect and create OrganizationBranch from rubros ──
    const branchRepo = connection.getRepository(ctx, OrganizationBranch);
    const allRubros = new Set<string>();
    for (const { node: entidad } of entities) {
        for (const r of parseRubros(entidad.rubro)) {
            allRubros.add(r);
        }
    }

    const rubroToBranch = new Map<string, OrganizationBranch>();
    if (allRubros.size > 0) {
        log(`Creating ${allRubros.size} rubro branches...`);
        for (const rubroName of allRubros) {
            const code = slugify(rubroName);
            let branch = await branchRepo.findOne({ where: { code } });
            if (!branch) {
                branch = await branchRepo.save(
                    branchRepo.create({
                        code,
                        name: rubroName,
                        enabled: true,
                        isPrivate: false,
                        isRoot: false,
                    })
                );
            }
            rubroToBranch.set(rubroName, branch);
        }
    }

    const argentina = await connection.getRepository(ctx, Country).findOne({ where: { code: 'AR' } });

    // ── Pass 1: Create organizations ─────────────────────
    const nidToOrg = new Map<string, Organization>();
    let orgCount = 0;
    let skippedOrgs = 0;

    for (const { node: entidad } of entities) {
        let tipo = entidad.tipo;
        if (tipo === 'cooperativa') tipo = 'cooperativas';
        if (tipo === 'ferias_espacios') tipo = 'ferias';

        const code = slugify(entidad.nombre || '');
        if (!code) { skippedOrgs++; continue; }

        const existingOrg = await organizationRepo.findOne({ where: { code } });
        if (existingOrg) {
            nidToOrg.set(entidad.nid, existingOrg);
            skippedOrgs++;
            continue;
        }

        // Resolve province code (from list or detail)
        let provinceCode = entidad.provincia;
        if (!provinceCode && entidad.provinciaNombre) {
            provinceCode = PROVINCE_NAME_TO_CODE[entidad.provinciaNombre.toLowerCase()] || '';
        }

        const provinceData = provinces.find(p => p.key === provinceCode);
        if (!provinceData) { skippedOrgs++; continue; }

        const provinceEntity = await provinceRepo.findOne({ where: { code: provinceCode } });
        if (!provinceEntity) { skippedOrgs++; continue; }

        const typeEntity = organizationTypes.find((t: OrganizationType) => t.code === tipo);
        if (!typeEntity) { skippedOrgs++; continue; }

        // Build description from detalle + rubros
        const rubros = parseRubros(entidad.rubro);
        let description = entidad.detalle || entidad.subtitulo || '';
        if (rubros.length > 0 && description) {
            description = `Rubros: ${rubros.join(', ')}\n\n${description}`;
        } else if (rubros.length > 0) {
            description = `Rubros: ${rubros.join(', ')}`;
        }

        // Build linksRRSS
        const linksRRSS: string[] = [];
        if (entidad.web) linksRRSS.push(entidad.web);

        const rubroNames = parseRubros(entidad.rubro);
        const orgBranches = rubroNames
            .map(name => rubroToBranch.get(name))
            .filter(Boolean) as OrganizationBranch[];

        const org = await organizationRepo.save(
            organizationRepo.create({
                code,
                name: entidad.nombre || '',
                enabled: true,
                description,
                email: '',
                type: typeEntity,
                linksRRSS: linksRRSS.length > 0 ? linksRRSS : undefined,
                branches: orgBranches.length > 0 ? orgBranches : undefined,
            })
        );

        // Build address from detail fields (fallback to list fields)
        const streetLine1 = entidad.calleCompleta || entidad.direccion || '';
        const address = await addressRepo.save(
            addressRepo.create({
                fullName: entidad.titulo_sede || '',
                streetLine1,
                streetLine2: entidad.nid,
                city: entidad.localidad || '',
                province: provinceEntity,
                country: argentina,
                postalCode: entidad.codPostal || '',
                phoneNumber: entidad.telefono || '',
                organization: org,
                location: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(entidad.longitud) || 0,
                        parseFloat(entidad.latitud) || 0,
                    ],
                } as any,
            })
        );

        org.defaultAddress = address;
        await organizationRepo.save(org);
        nidToOrg.set(entidad.nid, org);
        orgCount++;

        // Logo from detail (preferred) or list (skip Drupal internal URIs)
        const logoUrl = entidad.logoDetail?.src || entidad.logo;
        if (logoUrl && logoUrl.trim() !== '' && logoUrl.startsWith('http')) {
            try {
                const ext = getImageExtension(logoUrl);
                const localPath = path.resolve(IMPORT_DIR, 'images', `${code}.${ext}`);

                if (!fs.existsSync(localPath)) {
                    await downloadImage(logoUrl, localPath);
                }

                const assetResult = await assetService.createFromFileStream(
                    fs.createReadStream(localPath),
                    ctx
                );

                if ('id' in assetResult) {
                    await assetService.assignToChannel(ctx, {
                        assetIds: [assetResult.id],
                        channelId: 1,
                    });
                    org.logo = assetResult;
                    await organizationRepo.save(org);
                }
            } catch (err) {
                console.error(`    Logo error for ${entidad.nombre}:`, err instanceof Error ? err.message : err);
            }
        }
    }

    log(`Pass 1: ${orgCount} organizations created, ${skippedOrgs} skipped`);

    // ── Pass 2: Link affiliatedWith ──────────────────────
    let linkedCount = 0;
    for (const { node: entidad } of entities) {
        const related = parseEntidadesRel(entidad.entidadesRel);
        if (related.length === 0) continue;

        const org = nidToOrg.get(entidad.nid);
        if (!org) continue;

        for (const rel of related) {
            const relatedOrg = nidToOrg.get(rel.nid);
            if (relatedOrg && relatedOrg.id !== org.id) {
                if (!org.affiliatedWith) org.affiliatedWith = [];
                if (!org.affiliatedWith.some(o => o.id === relatedOrg.id)) {
                    org.affiliatedWith.push(relatedOrg);
                    linkedCount++;
                }
            }
        }

        if (org.affiliatedWith && org.affiliatedWith.length > 0) {
            await organizationRepo.save(org);
        }
    }

    log(`Pass 2: ${linkedCount} affiliated relationships linked`);
    log(`EssApp import complete: ${orgCount} created, ${linkedCount} affiliations`);
}

// ── Main ─────────────────────────────────────────────────
async function main() {
    console.log();
    console.log('='.repeat(60));
    console.log('  Huemul System Initialization');
    console.log('='.repeat(60));
    console.log();

    if (isDryRun) log('DRY RUN MODE – no changes will be made');

    // Stage 1: DB check, backup, reset
    await stageCheckAndResetDB();

    if (isDryRun) {
        log('DRY RUN – stopping here (bootstrap would start after reset)');
        process.exit(0);
    }

    // Stage 2: Bootstrap
    const app = await stageBootstrap();

    // Stage 3: SuperAdmin context
    const ctx = await getSuperadminContext(app);

    // Stage 4: Populate initial data (countries, zones, tax rates, roles)
    await stagePopulateInitialData(app, ctx);

    // Stage 5: Import provinces
    await stageImportProvinces(ctx, app);

    // Stage 6: Import EssApp entities
    await stageImportEssApp(ctx, app);

    // Done
    console.log();
    console.log('='.repeat(60));
    console.log('  System initialization complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('  Admin:    http://localhost:3000/admin');
    console.log('  Dashboard: http://localhost:3000/dashboard');
    console.log('  User:     superadmin / superadmin');
    console.log();

    await app.close();
    process.exit(0);
}

main().catch(err => {
    console.error('\nFatal error:', err);
    process.exit(1);
});
