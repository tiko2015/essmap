import { InputMaybe } from '../gql/generated';
import { Customer } from '@vendure/core';
import { Asset } from '@vendure/core';
import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    assertFound,
    patchEntity,
} from '@vendure/core';
import { omit } from '@vendure/common/lib/omit';
import { ORGANIZATIONS_PLUGIN_OPTIONS } from '../constants';
import { Organization } from '../entities/organization.entity';
import { OrganizationBranch } from '../entities/organization-branch.entity';
import { PluginInitOptions } from '../types';
import { OrganizationAddress } from '../entities/organization-address.entity';
import { OrganizationType } from '../entities/organization-type.entity';
import { CreateOrganizationInput, UpdateOrganizationInput } from '../gql/generated';

@Injectable()
export class OrganizationService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder, @Inject(ORGANIZATIONS_PLUGIN_OPTIONS) private options: PluginInitOptions
    ) { }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<Organization>,
        relations?: RelationPaths<Organization>,
    ): Promise<PaginatedList<Organization>> {
        const defaultRelations: RelationPaths<Organization> = [
            'type',
            'branches',
            'collaborators',
            'affiliatedWith',
            'addresses',
            'defaultAddress',
        ];

        return this.listQueryBuilder
            .build(Organization, options, {
                relations: relations && relations.length > 0 ? relations : defaultRelations,
                ctx,
            }
            ).getManyAndCount().then(([items, totalItems]) => {
                return {
                    items,
                    totalItems,
                }
            }
            );
    }

    /**
     * Builds a ListQueryBuilder query for the Organization entity.
     * Allows resolvers to add custom WHERE clauses before pagination.
     */
    buildListQuery(
        ctx: RequestContext,
        options?: ListQueryOptions<Organization>,
        relations?: RelationPaths<Organization>,
    ) {
        const defaultRelations: RelationPaths<Organization> = [
            'type',
            'branches',
            'collaborators',
            'affiliatedWith',
            'addresses',
            'defaultAddress',
        ] as any;

        return this.listQueryBuilder.build(Organization, options, {
            relations: relations && relations.length > 0 ? relations : defaultRelations,
            ctx,
        });
    }

    /**
     * Find organizations where the current user is owner or collaborator.
     * Used for non-SuperAdmin users to see only their organizations.
     */
    async findAllForUser(
        ctx: RequestContext,
        options?: ListQueryOptions<Organization>,
        relations?: RelationPaths<Organization>,
    ): Promise<PaginatedList<Organization>> {
        const activeUserId = ctx.activeUserId;

        if (!activeUserId) {
            return { items: [], totalItems: 0 };
        }

        const defaultRelations: RelationPaths<Organization> = [
            'type',
            'branches',
            'collaborators',
            'collaborators.user',
            'owner',
            'owner.user',
            'affiliatedWith',
            'addresses',
            'defaultAddress',
        ];

        // Build query with user filter
        const qb = this.listQueryBuilder
            .build(Organization, options, {
                relations: relations && relations.length > 0 ? relations : defaultRelations,
                ctx,
            });

        // Add WHERE clause to filter by owner or collaborator
        qb.leftJoin('organization.owner', 'owner')
            .leftJoin('owner.user', 'ownerUser')
            .leftJoin('organization.collaborators', 'collaborator')
            .leftJoin('collaborator.user', 'collaboratorUser')
            .andWhere('(ownerUser.id = :userId OR collaboratorUser.id = :userId)', { userId: activeUserId });

        const [items, totalItems] = await qb.getManyAndCount();

        return {
            items,
            totalItems,
        };
    }

    /**
     * Find organizations ordered by distance from a point, or by name if no coordinates.
     * Uses the organization's defaultAddress for distance calculation.
     * Supports filtering by products, name, type, and province.
     */
    async findAllByDistance(
        ctx: RequestContext,
        args: {
            options?: ListQueryOptions<Organization>,
            longitude?: number,
            latitude?: number,
            hasProducts?: boolean,
        },
        relations?: RelationPaths<Organization>,
    ): Promise<PaginatedList<Organization>> {
        const { options, longitude, latitude, hasProducts } = args;
        const limit = options?.take ?? 10;
        const offset = options?.skip ?? 0;
        const filter = (options?.filter || {}) as any;
        const hasCoords = longitude !== undefined && latitude !== undefined;

        const baseQb = this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization');

        baseQb.leftJoinAndSelect('organization.type', 'type');
        baseQb.leftJoinAndSelect('organization.logo', 'logo')
        baseQb.leftJoinAndSelect('organization.defaultAddress', 'defaultAddress');

        if (hasCoords) {
            baseQb.andWhere('"defaultAddress".location IS NOT NULL');
        }

        if (hasProducts) {
            baseQb.andWhere(
                `EXISTS (SELECT 1 FROM product p WHERE p."customFieldsOrganizationid" = organization.id)`,
            );
        }

        if (filter.province?.eq) {
            baseQb.andWhere('"defaultAddress"."provinceId" = :province', { province: filter.province.eq });
        }

        if (filter.name?.contains) {
            baseQb.andWhere('unaccent(organization.name) ILIKE unaccent(:name)', {
                name: `%${filter.name.contains}%`,
            });
        }

        if (filter.typeId?.eq) {
            baseQb.andWhere('organization.typeId = :typeId', { typeId: filter.typeId.eq });
        }

        const countQb = baseQb.clone();
        const totalItems = await countQb.getCount();

        if (hasCoords) {
            baseQb.addSelect(`
                ST_Distance(
                    "defaultAddress".location::geography,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                ) AS distance
            `)
                .setParameter('longitude', longitude)
                .setParameter('latitude', latitude)
                .orderBy('distance', 'ASC');
        } else {
            baseQb.orderBy('organization.name', 'ASC');
        }

        baseQb.limit(limit).offset(offset);

        const items = await baseQb.getMany();

        return {
            items,
            totalItems,
        };
    }

    async findByName(
        ctx: RequestContext,
        name: string,
        take: number = 25,
    ): Promise<Organization[]> {
        return this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.type', 'type')
            .leftJoinAndSelect('organization.defaultAddress', 'defaultAddress')
            .leftJoinAndSelect('defaultAddress.country', 'country')
            .leftJoinAndSelect('defaultAddress.province', 'province')
            .leftJoinAndSelect('organization.logo', 'logo')
            .leftJoinAndSelect('organization.banner', 'banner')
            .where('organization.name ILIKE :name', { name: `%${name}%` })
            .limit(take)
            .getMany();
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<Organization>,
    ): Promise<Organization | null> {
        const defaultRelations: RelationPaths<Organization> = [
            'type',
            'branches',
            'collaborators',
            'affiliatedWith',
            'addresses',
            'defaultAddress',
        ];

        return this.connection
            .getRepository(ctx, Organization)
            .findOne({
                where: { id },
                relations: relations && relations.length > 0 ? relations : defaultRelations,
            });
    }

    findOneByCode(
        ctx: RequestContext,
        code: string,
        relations?: RelationPaths<Organization>,
    ): Promise<Organization | null> {
        const defaultRelations: RelationPaths<Organization> = [
            'type',
            'branches',
            'collaborators',
            'affiliatedWith',
            'addresses',
            'defaultAddress',
        ];

        return this.connection
            .getRepository(ctx, Organization)
            .findOne({
                where: { code },
                relations: relations && relations.length > 0 ? relations : defaultRelations,
            });
    }

    async create(ctx: RequestContext, input: CreateOrganizationInput, relations?: RelationPaths<Organization>,): Promise<Organization> {
        const organization = new Organization(omit(input, ['ownerId', 'logoId', 'bannerId', 'branchesId']));
        if (input.ownerId) {
            organization.owner = await this.connection.getEntityOrThrow(ctx, Customer, input.ownerId);
        }

        if (input.logoId) {
            organization.logo = await this.connection.getEntityOrThrow(ctx, Asset, input.logoId);
        }

        if (input.bannerId) {
            organization.banner = await this.connection.getEntityOrThrow(ctx, Asset, input.bannerId);
        }

        // Load and associate branches
        if (input.branchesId && input.branchesId.length > 0) {
            organization.branches = await this.loadRelatedEntities(ctx, input.branchesId, OrganizationBranch);
        }

        const newEntity = await this.connection.getRepository(ctx, Organization).save(organization);
        return assertFound(this.findOne(ctx, newEntity.id, relations));
    }

    async update(ctx: RequestContext, input: UpdateOrganizationInput, relations?: RelationPaths<Organization>,): Promise<Organization> {
        const entity = await this.connection.getEntityOrThrow(ctx, Organization, input.id);
        const updatedEntity = patchEntity(entity, omit(input, ['typeId', 'ownerId', 'branchesId', 'collaboratorsId', 'affiliatedWithId', 'addressesId', 'logoId', 'bannerId', 'defaultAddressId']));

        updatedEntity.owner = await this.loadRelatedEntity(ctx, input.ownerId, Customer);
        updatedEntity.type = await this.loadRelatedEntity(ctx, input.typeId, OrganizationType);

        // Only update branches if explicitly provided
        if (input.branchesId !== undefined) {
            updatedEntity.branches = await this.loadRelatedEntities(ctx, input.branchesId, OrganizationBranch);
        }

        // Only update collaborators if explicitly provided
        if (input.collaboratorsId !== undefined) {
            updatedEntity.collaborators = await this.loadRelatedEntities(ctx, input.collaboratorsId, Customer);
        }

        // Only update affiliatedWith if explicitly provided
        if (input.affiliatedWithId !== undefined) {
            updatedEntity.affiliatedWith = await this.loadRelatedEntities(ctx, input.affiliatedWithId, Organization);
        }

        // Only update addresses if explicitly provided
        if (input.addressesId !== undefined) {
            updatedEntity.addresses = await this.loadRelatedEntities(ctx, input.addressesId, OrganizationAddress);
        }

        // Validate and set default address if provided
        if (input.defaultAddressId !== undefined) {
            if (input.defaultAddressId) {
                // Validate that the address exists and belongs to this organization
                const address = await this.connection.getRepository(ctx, OrganizationAddress).findOne({
                    where: { id: input.defaultAddressId },
                    relations: ['organization']
                });

                if (!address) {
                    throw new Error(`Address with ID ${input.defaultAddressId} does not exist`);
                }

                if (address.organization.id !== entity.id) {
                    throw new Error(`Address with ID ${input.defaultAddressId} does not belong to organization ${entity.id}`);
                }

                updatedEntity.defaultAddress = address;
            } else {
                // Allow clearing the default address by setting it to null
                updatedEntity.defaultAddress = null as any;
            }
        }

        updatedEntity.logo = await this.loadRelatedEntity(ctx, input.logoId, Asset);
        updatedEntity.banner = await this.loadRelatedEntity(ctx, input.bannerId, Asset);

        await this.connection.getRepository(ctx, Organization).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id, relations));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, Organization, id);
        try {
            await this.connection.getRepository(ctx, Organization).remove(entity);
            return {
                result: DeletionResult.DELETED,
            };
        } catch (e: any) {
            return {
                result: DeletionResult.NOT_DELETED,
                message: e.toString(),
            };
        }
    }

    private async loadRelatedEntities<T>(
        ctx: RequestContext,
        ids: InputMaybe<string[]> | undefined,
        entityClass: any
    ): Promise<any> {
        if (!ids) {
            return [];
        }
        const entities = [];
        for (const id of ids) {
            const entity = await this.connection.getEntityOrThrow(ctx, entityClass, id);
            entities.push(entity);
        }
        return entities;
    }

    private async loadRelatedEntity<T>(
        ctx: RequestContext,
        id: InputMaybe<string> | undefined,
        entityClass: any
    ): Promise<any> {
        if (!id) {
            return;
        }
        return await this.connection.getEntityOrThrow(ctx, entityClass, id);
    }

}
