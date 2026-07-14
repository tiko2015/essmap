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
import { OrganizationAddress } from '../entities/organization-address.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationAddressService } from '../services/organization-address.service';
import { OrganizationAuthService } from '../services/organization-auth.service';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationAddressInput, UpdateOrganizationAddressInput } from '../gql/generated'

@Resolver()
export class OrganizationAddressAdminResolver {
    constructor(
        private organizationAddressService: OrganizationAddressService,
        private organizationAuthService: OrganizationAuthService,
        private organizationService: OrganizationService
    ) { }

    @Query()
    @Allow(Permission.Public)
    async organizationAddress(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(OrganizationAddress) relations: RelationPaths<OrganizationAddress>,
    ): Promise<OrganizationAddress | null> {
        return this.organizationAddressService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async organizationAddresses(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<OrganizationAddress> },
        @Relations(OrganizationAddress) relations: RelationPaths<OrganizationAddress>,
    ): Promise<PaginatedList<OrganizationAddress>> {
        return this.organizationAddressService.findAll(ctx, args.options || undefined, relations);
    }

    @Query()
    @Allow(Permission.Public)
    async organizationAddressesByDistance(
        @Ctx() ctx: RequestContext,
        @Args() args: {
            options?: ListQueryOptions<OrganizationAddress>,
            longitude: number,
            latitude: number,
        },
        @Relations(OrganizationAddress) relations: RelationPaths<OrganizationAddress>,
    ): Promise<PaginatedList<OrganizationAddress>> {
        return this.organizationAddressService.findAllByDistance(ctx, {
            options: args.options || {},
            longitude: args.longitude,
            latitude: args.latitude,
        }, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async createOrganizationAddress(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateOrganizationAddressInput },
    ): Promise<OrganizationAddress> {
        await this.organizationAuthService.assertCanEditOrganization(ctx, args.input.organization);
        return this.organizationAddressService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async updateOrganizationAddress(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateOrganizationAddressInput },
    ): Promise<OrganizationAddress> {
        await this.organizationAuthService.assertCanEditOrganizationByAddress(ctx, args.input.id);
        return this.organizationAddressService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async deleteOrganizationAddress(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
        await this.organizationAuthService.assertCanEditOrganizationByAddress(ctx, args.id);
        return this.organizationAddressService.delete(ctx, args.id);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async setDefaultOrganizationAddress(
        @Ctx() ctx: RequestContext,
        @Args() args: { organizationId: ID; addressId: ID }
    ): Promise<Organization> {
        await this.organizationAuthService.assertCanEditOrganization(ctx, args.organizationId);
        return this.organizationService.update(ctx, {
            id: args.organizationId.toString(),
            defaultAddressId: args.addressId.toString()
        });
    }
}
