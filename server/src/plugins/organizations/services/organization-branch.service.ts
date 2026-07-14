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
import { OrganizationBranch } from '../entities/organization-branch.entity';
import { Organization } from '../entities/organization.entity';
import { PluginInitOptions } from '../types';
import { CreateOrganizationBranchInput, UpdateOrganizationBranchInput } from '../gql/generated';

@Injectable()
export class OrganizationBranchService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        @Inject(ORGANIZATIONS_PLUGIN_OPTIONS) private options: PluginInitOptions
    ) { }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<OrganizationBranch>,
        relations?: RelationPaths<OrganizationBranch>,
    ): Promise<PaginatedList<OrganizationBranch>> {
        return this.listQueryBuilder
            .build(OrganizationBranch, options, {
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
        relations?: RelationPaths<OrganizationBranch>,
    ): Promise<OrganizationBranch | null> {
        return this.connection
            .getRepository(ctx, OrganizationBranch)
            .findOne({
                where: { id },
                relations,
            });
    }

    async create(ctx: RequestContext, input: CreateOrganizationBranchInput): Promise<OrganizationBranch> {
        // Collect all validation errors
        const validationErrors: string[] = [];

        // Validate required field: code
        if (!input.code || input.code.trim() === '') {
            validationErrors.push('OrganizationBranch code is required and cannot be empty');
        }

        // Validate required field: name
        if (!input.name || input.name.trim() === '') {
            validationErrors.push('OrganizationBranch name is required and cannot be empty');
        }

        // Validate description length if provided
        if (input.description !== undefined && input.description !== null) {
            if (input.description.length > 5000) {
                validationErrors.push('OrganizationBranch description cannot exceed 5000 characters');
            }
        }

        // Validate enabled field is boolean if provided
        if (input.enabled !== undefined && input.enabled !== null && typeof input.enabled !== 'boolean') {
            validationErrors.push('OrganizationBranch enabled field must be a boolean value');
        }

        // Return all validation errors in single response
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
        }

        // Validate code uniqueness across all branches
        if (input.code) {
            const existingBranch = await this.connection.getRepository(ctx, OrganizationBranch).findOne({
                where: { code: input.code }
            });
            if (existingBranch) {
                throw new Error(`OrganizationBranch with code '${input.code}' already exists`);
            }
        }

        // Load logo if provided
        let logo: Asset | undefined;
        if (input.logoId) {
            logo = await this.connection.getEntityOrThrow(ctx, Asset, input.logoId);
        }

        const newEntity = await this.connection.getRepository(ctx, OrganizationBranch).save({
            code: input.code,
            name: input.name,
            description: input.description,
            enabled: input.enabled ?? true,
            isPrivate: input.isPrivate ?? false,
            isRoot: input.isRoot ?? false,
            logo,
        });

        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateOrganizationBranchInput): Promise<OrganizationBranch> {
        const entity = await this.connection.getEntityOrThrow(ctx, OrganizationBranch, input.id);

        // Collect all validation errors
        const validationErrors: string[] = [];

        // Validate code field if provided
        if (input.code !== undefined && input.code !== null) {
            if (input.code.trim() === '') {
                validationErrors.push('OrganizationBranch code cannot be empty');
            }
        }

        // Validate name field if provided
        if (input.name !== undefined && input.name !== null) {
            if (input.name.trim() === '') {
                validationErrors.push('OrganizationBranch name cannot be empty');
            }
        }

        // Validate description length if provided
        if (input.description !== undefined && input.description !== null) {
            if (input.description.length > 5000) {
                validationErrors.push('OrganizationBranch description cannot exceed 5000 characters');
            }
        }

        // Validate enabled field is boolean if provided
        if (input.enabled !== undefined && input.enabled !== null && typeof input.enabled !== 'boolean') {
            validationErrors.push('OrganizationBranch enabled field must be a boolean value');
        }

        // Return all validation errors in single response
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('; '));
        }

        // Validate code uniqueness across all branches if code is being changed
        if (input.code !== undefined && input.code !== null && input.code !== entity.code) {
            const existingBranch = await this.connection.getRepository(ctx, OrganizationBranch).findOne({
                where: { code: input.code }
            });
            if (existingBranch) {
                throw new Error(`OrganizationBranch with code '${input.code}' already exists`);
            }
        }

        // Load logo if provided
        if (input.logoId) {
            entity.logo = await this.connection.getEntityOrThrow(ctx, Asset, input.logoId);
        }

        // Update entity with provided fields
        const updatedEntity = patchEntity(entity, {
            code: input.code,
            name: input.name,
            description: input.description,
            enabled: input.enabled,
            isPrivate: input.isPrivate,
            isRoot: input.isRoot,
        });

        await this.connection.getRepository(ctx, OrganizationBranch).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, OrganizationBranch, id);

        return await this.connection.withTransaction(ctx, async (transactionCtx) => {
            // Check for associated organizations before deletion
            const associatedOrgsCount = await this.connection
                .getRepository(transactionCtx, Organization)
                .createQueryBuilder('organization')
                .innerJoin('organization.branches', 'branch')
                .where('branch.id = :id', { id })
                .getCount();

            if (associatedOrgsCount > 0) {
                return {
                    result: DeletionResult.NOT_DELETED,
                    message: `Cannot delete OrganizationBranch because it is associated with ${associatedOrgsCount} organization(s)`,
                };
            }

            try {
                await this.connection.getRepository(transactionCtx, OrganizationBranch).remove(entity);
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
