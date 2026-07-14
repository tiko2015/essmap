import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
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
import { Organization } from '../entities/organization.entity';
import { OrganizationService } from '../services/organization.service';
import { OrganizationAuthService } from '../services/organization-auth.service';
import { CreateOrganizationInput, UpdateOrganizationInput } from '../gql/generated';
import { TransactionalConnection } from '@vendure/core';

@Resolver()
export class OrganizationAdminResolver {
    constructor(
        private organizationService: OrganizationService,
        private organizationAuthService: OrganizationAuthService,
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
    async organizations(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<Organization> },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<PaginatedList<Organization>> {
        // SuperAdmin can see all organizations
        if (ctx.userHasPermissions(['SuperAdmin' as any])) {
            return this.organizationService.findAll(ctx, args.options || undefined, relations);
        }
        
        // Other users only see organizations where they are owner or collaborator
        return this.organizationService.findAllForUser(ctx, args.options || undefined, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async canEditOrganization(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
    ): Promise<boolean> {
        return this.organizationAuthService.canEditOrganization(ctx, args.id);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async createOrganization(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateOrganizationInput },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<Organization> {
        return this.organizationService.create(ctx, args.input, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async updateOrganization(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateOrganizationInput },
        @Relations(Organization) relations: RelationPaths<Organization>,
    ): Promise<Organization> {
        await this.organizationAuthService.assertCanEditOrganization(ctx, args.input.id);
        return this.organizationService.update(ctx, args.input, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async deleteOrganization(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
        await this.organizationAuthService.assertCanEditOrganization(ctx, args.id);
        return this.organizationService.delete(ctx, args.id);
    }
}

@Resolver('Organization')
export class OrganizationProductsTotalResolver {
    constructor(private connection: TransactionalConnection,) { }

    @ResolveField()
    async productsTotal(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        const result = await this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.products', 'products')
            .where('organization.id = :id', { id: organization.id })
            .select('COUNT(products.id)', 'count')
            .getRawOne();
        return parseInt(result?.count || 0, 10);
    }
}

@Resolver('Organization')
export class OrganizationFieldResolver {
    constructor(private connection: TransactionalConnection) { }

    @ResolveField()
    async type(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        if (organization.type) {
            return organization.type;
        }
        const result = await this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.type', 'type')
            .where('organization.id = :id', { id: organization.id })
            .getOne();
        return result?.type || null;
    }

    @ResolveField()
    async branches(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        if (organization.branches) {
            return organization.branches;
        }
        return this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.branches', 'branches')
            .where('organization.id = :id', { id: organization.id })
            .select('branches')
            .getMany();
    }

    @ResolveField()
    async collaborators(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        if (organization.collaborators) {
            return organization.collaborators;
        }
        return this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.collaborators', 'collaborators')
            .where('organization.id = :id', { id: organization.id })
            .select('collaborators')
            .getMany();
    }

    @ResolveField()
    async affiliatedWith(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        if (organization.affiliatedWith) {
            return organization.affiliatedWith;
        }
        return this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.affiliatedWith', 'affiliatedWith')
            .where('organization.id = :id', { id: organization.id })
            .select('affiliatedWith')
            .getMany();
    }

    @ResolveField()
    async banner(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        if (organization.banner) {
            return organization.banner;
        }
        const result = await this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.banner', 'banner')
            .where('organization.id = :id', { id: organization.id })
            .getOne();
        return result?.banner || null;
    }

    @ResolveField()
    async addresses(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        return this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.addresses', 'addresses')
            .where('organization.id = :id', { id: organization.id })
            .select('addresses')
            .getMany();
    }

    @ResolveField()
    async defaultAddress(@Ctx() ctx: RequestContext, @Parent() organization: Organization) {
        const result = await this.connection.getRepository(ctx, Organization)
            .createQueryBuilder('organization')
            .leftJoinAndSelect('organization.defaultAddress', 'defaultAddress')
            .where('organization.id = :id', { id: organization.id })
            .getOne();
        return result?.defaultAddress || null;
    }
}