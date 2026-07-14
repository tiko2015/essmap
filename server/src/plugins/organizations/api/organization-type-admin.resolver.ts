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
import { OrganizationType } from '../entities/organization-type.entity';
import { OrganizationTypeService } from '../services/organization-type.service';
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

@Resolver()
export class OrganizationTypeAdminResolver {
    constructor(private organizationTypeService: OrganizationTypeService) { }

    @Query()
    @Allow(Permission.Public)
    async organizationType(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(OrganizationType) relations: RelationPaths<OrganizationType>,
    ): Promise<OrganizationType | null> {
        return this.organizationTypeService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async organizationTypes(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<OrganizationType> },
        @Relations(OrganizationType) relations: RelationPaths<OrganizationType>,
    ): Promise<PaginatedList<OrganizationType>> {
        return this.organizationTypeService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async createOrganizationType(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateOrganizationTypeInput },
    ): Promise<OrganizationType> {
        return this.organizationTypeService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async updateOrganizationType(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateOrganizationTypeInput },
    ): Promise<OrganizationType> {
        return this.organizationTypeService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async deleteOrganizationType(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
        return this.organizationTypeService.delete(ctx, args.id);
    }
}
