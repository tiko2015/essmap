import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse, Permission } from '@vendure/common/lib/generated-types';
import {
    Allow,
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    RelationPaths,
    Relations,
    RequestContext,
    Transaction
} from '@vendure/core';
import { OrganizationBranch } from '../entities/organization-branch.entity';
import { OrganizationBranchService } from '../services/organization-branch.service';
import { CreateOrganizationBranchInput, UpdateOrganizationBranchInput } from '../gql/generated';

@Resolver()
export class OrganizationBranchAdminResolver {
    constructor(private organizationBranchService: OrganizationBranchService) { }

    @Query()
    @Allow(Permission.ReadCatalog, Permission.ReadProduct)
    async organizationBranch(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(OrganizationBranch) relations: RelationPaths<OrganizationBranch>,
    ): Promise<OrganizationBranch | null> {
        return this.organizationBranchService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.ReadCatalog, Permission.ReadProduct)
    async organizationBranchs(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<OrganizationBranch> },
        @Relations(OrganizationBranch) relations: RelationPaths<OrganizationBranch>,
    ): Promise<PaginatedList<OrganizationBranch>> {
        return this.organizationBranchService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async createOrganizationBranch(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateOrganizationBranchInput },
    ): Promise<OrganizationBranch> {
        return this.organizationBranchService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async updateOrganizationBranch(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateOrganizationBranchInput },
    ): Promise<OrganizationBranch> {
        return this.organizationBranchService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async deleteOrganizationBranch(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
        return this.organizationBranchService.delete(ctx, args.id);
    }
}
