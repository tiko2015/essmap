import * as fs from 'fs';
import * as path from 'path';

const ESSAPP_LIST_URL = 'https://essapp.coop/?q=essapp/puntos-atencion/todos/todos/todos/todos/todos/todos/';
const ESSAPP_DETAIL_URL = 'https://essapp.coop/?q=essapp/detalle-punto/';

interface Entidad {
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
    distance?: number;
}

interface DetailData {
    logo?: { src: string; alt: string };
    share_url?: string;
    nombre?: string;
    titulo_sede?: string;
    subtitulo?: string;
    video_url?: string;
    galeria?: Array<{ src: string; alt: string }>;
    valoraciones?: any;
    calle?: string;
    _departamento?: string;
    _localidad?: string;
    _provincia?: string;
    _cod_postal?: string;
    horario?: string;
    telefono?: string;
    web?: string;
    descuentos?: string;
    detalle?: string;
    tipo_de_medio?: string;
    rubro?: string;
    actividades?: string;
    productos?: string;
    servicios?: string;
    balance?: string;
    asociados?: string;
    entidades_rel?: string;
    nid_entidad?: string;
    observaciones?: string;
}

interface EnrichedEntidad extends Entidad {
    logoDetail?: { src: string; alt: string } | null;
    shareUrl?: string;
    videoUrl?: string;
    galeria?: Array<{ src: string; alt: string }>;
    calleCompleta?: string;
    localidad?: string;
    provinciaNombre?: string;
    codPostal?: string;
    horario?: string;
    telefono?: string;
    web?: string;
    detalle?: string;
    rubro?: string;
    actividades?: string;
    productos?: string;
    servicios?: string;
    asociados?: string;
    entidadesRel?: string;
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

async function downloadImage(url: string, filePath: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        if (!response.ok) return false;
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        return true;
    } catch {
        return false;
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchDetail(nid: string): Promise<DetailData | null> {
    try {
        const response = await fetch(`${ESSAPP_DETAIL_URL}${nid}`);
        if (!response.ok) {
            console.error(`    Detail fetch failed for nid ${nid}: HTTP ${response.status}`);
            return null;
        }
        const data = await response.json();
        const node = data.nodes?.[0]?.node;
        if (!node) {
            console.error(`    Detail response missing node for nid ${nid}`);
            return null;
        }
        return node as DetailData;
    } catch (err) {
        console.error(`    Detail fetch error for nid ${nid}:`, err);
        return null;
    }
}

function mergeDetail(entidad: Entidad, detail: DetailData): EnrichedEntidad {
    return {
        ...entidad,
        logoDetail: detail.logo || null,
        shareUrl: detail.share_url,
        videoUrl: detail.video_url,
        galeria: detail.galeria,
        calleCompleta: detail.calle || '',
        localidad: detail._localidad || '',
        provinciaNombre: detail._provincia || '',
        codPostal: detail._cod_postal || '',
        horario: detail.horario || '',
        telefono: detail.telefono || '',
        web: detail.web || '',
        detalle: detail.detalle || '',
        rubro: detail.rubro || '',
        actividades: detail.actividades || '',
        productos: detail.productos || '',
        servicios: detail.servicios || '',
        asociados: detail.asociados || '',
        entidadesRel: detail.entidades_rel || '',
    };
}

async function main() {
    const importDir = path.resolve(__dirname, '..');
    const imagesDir = path.resolve(importDir, 'images');
    const jsonPath = path.resolve(importDir, 'entidades.json');

    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Step 1: Fetch list
    console.log('Fetching entities list from EssApp API...');
    const listResponse = await fetch(ESSAPP_LIST_URL);
    if (!listResponse.ok) throw new Error(`List fetch failed: ${listResponse.status}`);
    const listData = await listResponse.json();
    const entities: Array<{ node: Entidad }> = listData.nodes;
    console.log(`Received ${entities.length} entities\n`);

    // Step 2: Fetch detail for each entity
    console.log('Fetching details for each entity...');
    const enrichedEntities: Array<{ node: EnrichedEntidad }> = [];
    let detailSuccess = 0;
    let detailFailed = 0;

    for (let i = 0; i < entities.length; i++) {
        const { node: entidad } = entities[i];
        process.stdout.write(`\r  [${i + 1}/${entities.length}] ${entidad.nombre.substring(0, 50)}`);

        const detail = await fetchDetail(entidad.nid);
        if (detail) {
            enrichedEntities.push({ node: mergeDetail(entidad, detail) });
            detailSuccess++;
        } else {
            enrichedEntities.push({ node: mergeDetail(entidad, {} as DetailData) });
            detailFailed++;
        }

        if (i < entities.length - 1) {
            await delay(300);
        }
    }

    console.log(`\n  Details: ${detailSuccess} ok, ${detailFailed} failed`);

    // Step 3: Save enriched JSON
    fs.writeFileSync(jsonPath, JSON.stringify({ nodes: enrichedEntities }, null, 2));
    console.log(`\nSaved enriched data to entidades.json`);

    // Step 4: Download images
    const allImages: Array<{ code: string; url: string }> = [];

    for (const { node: entidad } of enrichedEntities) {
        const code = slugify(entidad.nombre || '');

        // Logo from detail (preferred) or from list
        const logoUrl = entidad.logoDetail?.src || entidad.logo;
        if (logoUrl && logoUrl.trim() !== '') {
            allImages.push({ code, url: logoUrl });
        }

        // Gallery images
        if (entidad.galeria && Array.isArray(entidad.galeria)) {
            for (const img of entidad.galeria) {
                if (img.src) {
                    allImages.push({ code: `${code}-galeria-${slugify(img.src.substring(img.src.lastIndexOf('/') + 1, img.src.indexOf('?'))) || Math.random().toString(36).slice(2, 8)}`, url: img.src });
                }
            }
        }
    }

    console.log(`\nDownloading ${allImages.length} images...`);
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const img of allImages) {
        const ext = getImageExtension(img.url);
        const fileName = `${img.code}.${ext}`;
        const filePath = path.resolve(imagesDir, fileName);

        if (fs.existsSync(filePath)) {
            skipped++;
            continue;
        }

        const ok = await downloadImage(img.url, filePath);
        if (ok) {
            downloaded++;
        } else {
            failed++;
        }
    }

    console.log(`Images: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
