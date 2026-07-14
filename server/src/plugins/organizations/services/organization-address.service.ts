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
    Country
} from '@vendure/core';
import { Province } from '@vendure/core/dist/entity/region/province.entity';
import { Point } from 'geojson';
import { ORGANIZATIONS_PLUGIN_OPTIONS } from '../constants';
import { Organization } from '../entities/organization.entity';
import { OrganizationAddress } from '../entities/organization-address.entity';
import { PluginInitOptions } from '../types';
import { CreateOrganizationAddressInput, UpdateOrganizationAddressInput } from '../gql/generated'

@Injectable()
export class OrganizationAddressService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        @Inject(ORGANIZATIONS_PLUGIN_OPTIONS) private options: PluginInitOptions
    ) { }

    async findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<OrganizationAddress>,
        relations?: RelationPaths<OrganizationAddress>,
    ): Promise<PaginatedList<OrganizationAddress>> {
        const qb = this.listQueryBuilder.build(OrganizationAddress, options, {
            relations,
            ctx,
            customPropertyMap: {
                organizationName: 'organization.name',
                organizationType: 'organization.type',
            },
        });

        const [items, totalItems] = await qb.getManyAndCount();
        return {
            items,
            totalItems,
        };
    }

    async findAllByDistance(
        ctx: RequestContext,
        args: {
            options: ListQueryOptions<OrganizationAddress>,
            longitude: number,
            latitude: number,
        },
        relations?: RelationPaths<OrganizationAddress>,
    ): Promise<PaginatedList<OrganizationAddress>> {
        const { options, longitude, latitude } = args;
        const limit = options?.take ?? 10;
        const offset = options?.skip ?? 0;
        const filter = (options?.filter || {}) as any;

        const baseQb = this.connection.getRepository(ctx, OrganizationAddress)
            .createQueryBuilder('organizationaddress');

        baseQb.leftJoinAndSelect('organizationaddress.organization', 'organization');
        baseQb.leftJoinAndSelect('organization.type', 'organizationType');

        if (filter.province?.eq) {
            baseQb.andWhere('organizationaddress.provinceId = :province', { province: filter.province.eq });
        }

        if (filter.organizationName?.contains) {
            baseQb.andWhere('unaccent(organization.name) ILIKE unaccent(:name)', {
                name: `%${filter.organizationName.contains}%`,
            });
        }

        if (filter.organizationType?.eq) {
            baseQb.andWhere('organization.typeId = :type', { type: filter.organizationType.eq });
        }

        const countQb = baseQb.clone();
        const totalItems = await countQb.getCount();

        baseQb.addSelect(`
            ST_Distance(
                "organizationaddress".location::geography,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
            ) AS distance
        `)
            .setParameter('longitude', longitude)
            .setParameter('latitude', latitude)
            .orderBy('distance', 'ASC')
            .limit(limit)
            .offset(offset);

        const items = await baseQb.getMany();

        return {
            items,
            totalItems,
        };
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<OrganizationAddress>,
    ): Promise<OrganizationAddress | null> {
        return this.connection
            .getRepository(ctx, OrganizationAddress)
            .findOne({
                where: { id },
                relations,
            });
    }

    async create(ctx: RequestContext, input: CreateOrganizationAddressInput): Promise<OrganizationAddress> {
        // Collect all validation errors
        const validationErrors: string[] = [];

        // Validate required field: streetLine1
        if (!input.streetLine1 || input.streetLine1.trim() === '') {
            validationErrors.push('OrganizationAddress streetLine1 is required and cannot be empty');
        }

        // Validate location coordinates if provided
        if (input.location) {
            const { latitude, longitude } = input.location;

            if (latitude < -90 || latitude > 90) {
                validationErrors.push('OrganizationAddress location latitude must be between -90 and 90');
            }

            if (longitude < -180 || longitude > 180) {
                validationErrors.push('OrganizationAddress location longitude must be between -180 and 180');
            }
        }

        // Return all validation errors in single response
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
        }

        let location: Point | null = null;
        let organization: Organization | undefined;
        let countryEntity: Country | undefined;
        let provinceEntity: Province | undefined;

        if (input.location) {
            location = {
                type: 'Point',
                coordinates: [input.location.longitude, input.location.latitude],
            };
        }
        if (input.organization) {
            organization = await this.connection.getEntityOrThrow(ctx, Organization, input.organization);
        }
        if (input.country) {
            countryEntity = await this.connection.getEntityOrThrow(ctx, Country, input.country);
        }
        if (input.province) {
            provinceEntity = await this.connection.getEntityOrThrow(ctx, Province, input.province);
        }

        const { country, province, ...restInput } = input;
        const updatedEntity = this.connection.getRepository(ctx, OrganizationAddress).create({
            ...restInput,
            location,
            organization,
            country: countryEntity,
            province: provinceEntity,
        });

        const newEntity = await this.connection.getRepository(ctx, OrganizationAddress).save(updatedEntity);
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateOrganizationAddressInput): Promise<OrganizationAddress> {
        const entity = await this.connection.getEntityOrThrow(ctx, OrganizationAddress, input.id);

        // Collect all validation errors
        const validationErrors: string[] = [];

        // Validate streetLine1 if provided
        if (input.streetLine1 !== undefined) {
            if (!input.streetLine1 || input.streetLine1.trim() === '') {
                validationErrors.push('OrganizationAddress streetLine1 cannot be empty');
            }
        }

        // Validate location coordinates if provided
        if (input.location) {
            const { latitude, longitude } = input.location;

            if (latitude < -90 || latitude > 90) {
                validationErrors.push('OrganizationAddress location latitude must be between -90 and 90');
            }

            if (longitude < -180 || longitude > 180) {
                validationErrors.push('OrganizationAddress location longitude must be between -180 and 180');
            }
        }

        // Return all validation errors in single response
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
        }

        if (input.location) {
            const point: Point = {
                type: 'Point',
                coordinates: [input.location.longitude, input.location.latitude],
            };

            entity.location = point;
        }
        if (input.organization) {
            entity.organization = await this.connection.getEntityOrThrow(ctx, Organization, input.organization);
        }
        if (input.country) {
            entity.country = await this.connection.getEntityOrThrow(ctx, Country, input.country);
        }
        if (input.province) {
            entity.province = await this.connection.getEntityOrThrow(ctx, Province, input.province);
        }

        const { location, organization, country, province, ...restInput } = input;
        const updatedEntity = patchEntity(entity, restInput);
        await this.connection.getRepository(ctx, OrganizationAddress).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, OrganizationAddress, id, {
            relations: ['organization']
        });

        return await this.connection.withTransaction(ctx, async (transactionCtx) => {
            try {
                // Check if this address is the default address for its organization
                if (entity.organization && entity.organization.defaultAddress?.id === id) {
                    // Clear the organization's defaultAddress
                    entity.organization.defaultAddress = null as any;
                    await this.connection.getRepository(transactionCtx, Organization).save(entity.organization);
                }

                // Delete the address
                await this.connection.getRepository(transactionCtx, OrganizationAddress).remove(entity);

                return {
                    result: DeletionResult.DELETED,
                };
            } catch (e: any) {
                return {
                    result: DeletionResult.NOT_DELETED,
                    message: e.toString(),
                };
            }
        });
    }
}
