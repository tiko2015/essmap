import { Args, Query, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    Permission,
    RelationPaths,
    Relations,
    RequestContext,
} from '@vendure/core';
import { Organization } from '../entities/organization.entity';
import { OrganizationService } from '../services/organization.service';
import { TransactionalConnection } from '@vendure/core';

/**
 * Shop API resolver for organizations.
 *
 * In the Shop API, all organizations are public and visible to everyone.
 * No filtering by owner/collaborator is applied.
 */
@Resolver()
export class OrganizationShopResolver {
    constructor(
        private organizationService: OrganizationService,
        private connection: TransactionalConnection,
    ) { }

    @Query()
    @Allow(Permission.Public)
    async organization(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<Organization | null> {
        return this.organizationService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async organizationByCode(
        @Ctx() ctx: RequestContext,
        @Args() args: { code: string },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<Organization | null> {
        return this.organizationService.findOneByCode(ctx, args.code, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async organizations(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Organization> },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<PaginatedList<Organization>> {
        const options = { ...(args.options || {}) } as any;

        return this.organizationService.findAll(ctx, options, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async organizationsByDistance(
        @Ctx() ctx: RequestContext,
        @Args() args: {
            options?: ListQueryOptions<Organization>,
            longitude: number,
            latitude: number,
            hasProducts?: boolean,
        },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<PaginatedList<Organization>> {
        return this.organizationService.findAllByDistance(
            ctx,
            {
                options: args.options,
                longitude: args.longitude,
                latitude: args.latitude,
                hasProducts: args.hasProducts,
            },
            relations,
        );
    }
}
