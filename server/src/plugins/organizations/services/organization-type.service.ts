import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
    Asset,
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    assertFound,
    patchEntity
} from '@vendure/core';
import { ORGANIZATIONS_PLUGIN_OPTIONS } from '../constants';
import { OrganizationType } from '../entities/organization-type.entity';
import { Organization } from '../entities/organization.entity';
import { PluginInitOptions } from '../types';
import { CreateOrganizationTypeInput, UpdateOrganizationTypeInput } from '../gql/generated'

// // These can be replaced by generated types if you set up code generation
// interface CreateOrganizationTypeInput {
//     code: string;
//     name: string;
//     // Define the input fields here
// }
// interface UpdateOrganizationTypeInput {
//     id: ID;
//     code?: string;
//     name?: string;
//     // Define the input fields here
// }

@Injectable()
export class OrganizationTypeService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder, @Inject(ORGANIZATIONS_PLUGIN_OPTIONS) private options: PluginInitOptions
    ) { }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<OrganizationType>,
        relations?: RelationPaths<OrganizationType>,
    ): Promise<PaginatedList<OrganizationType>> {
        return this.listQueryBuilder
            .build(OrganizationType, options, {
                relations,
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

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<OrganizationType>,
    ): Promise<OrganizationType | null> {
        return this.connection
            .getRepository(ctx, OrganizationType)
            .findOne({
                where: { id },
                relations,
            });
    }

    async create(ctx: RequestContext, input: CreateOrganizationTypeInput): Promise<OrganizationType> {
        // Collect all validation errors
        const validationErrors: string[] = [];

        // Validate required field: code
        if (!input.code || input.code.trim() === '') {
            validationErrors.push('OrganizationType code is required and cannot be empty');
        }

        // Validate required field: name
        if (!input.name || input.name.trim() === '') {
            validationErrors.push('OrganizationType name is required and cannot be empty');
        }

        // Return all validation errors in single response
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
        }

        // Validate code uniqueness
        if (input.code) {
            const existingType = await this.connection.getRepository(ctx, OrganizationType).findOne({
                where: { code: input.code }
            });
            if (existingType) {
                throw new Error(`OrganizationType with code '${input.code}' already exists`);
            }
        }

        const newEntity = await this.connection.getRepository(ctx, OrganizationType).save(input);
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateOrganizationTypeInput): Promise<OrganizationType> {
        const entity = await this.connection.getEntityOrThrow(ctx, OrganizationType, input.id);
        
        // Collect all validation errors
        const validationErrors: string[] = [];

        // Validate code field if provided
        if (input.code !== undefined && input.code !== null) {
            if (input.code.trim() === '') {
                validationErrors.push('OrganizationType code cannot be empty');
            }
        }


        // Validate name field if provided
        if (input.name !== undefined && input.name !== null) {
            if (input.name.trim() === '') {
                validationErrors.push('OrganizationType name cannot be empty');
            }
        }

        // Return all validation errors in single response
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
        }

        // Validate code uniqueness if code is being changed
        if (input.code !== undefined && input.code !== null && input.code !== entity.code) {
            const existingType = await this.connection.getRepository(ctx, OrganizationType).findOne({
                where: { code: input.code }
            });
            if (existingType) {
                throw new Error(`OrganizationType with code '${input.code}' already exists`);
            }
        }


        if (input.logo) {
            entity.logo = await this.connection.getEntityOrThrow(ctx, Asset, input.logo);
        }

        const { logo, ...restInput } = input;
        const updatedEntity = patchEntity(entity, restInput);
        const newlogo = (logo) ? await this.connection.getEntityOrThrow(ctx, Asset, logo) : undefined;
        await this.connection.getRepository(ctx, OrganizationType).save({
            ...updatedEntity,
            logo: newlogo
        }, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, OrganizationType, id);
        
        return await this.connection.withTransaction(ctx, async (transactionCtx) => {
            // Check for associated organizations before deletion
            const associatedOrgsCount = await this.connection
                .getRepository(transactionCtx, Organization)
                .createQueryBuilder('organization')
                .innerJoin('organization.type', 'type')
                .where('type.id = :id', { id })
                .getCount();

            if (associatedOrgsCount > 0) {
                return {
                    result: DeletionResult.NOT_DELETED,
                    message: `Cannot delete OrganizationType because it is used by ${associatedOrgsCount} organization(s)`,
                };
            }

            try {
                await this.connection.getRepository(transactionCtx, OrganizationType).remove(entity);
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
