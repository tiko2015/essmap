import { Injectable } from '@nestjs/common';
import { ForbiddenError } from '@vendure/core';
import {
    RequestContext,
    TransactionalConnection,
    Customer,
    User,
} from '@vendure/core';
import { ID } from '@vendure/common/lib/shared-types';
import { Organization } from '../entities/organization.entity';
import { OrganizationAddress } from '../entities/organization-address.entity';

@Injectable()
export class OrganizationAuthService {
    constructor(private connection: TransactionalConnection) {}

    /**
     * Returns true if the active user can edit the given organization.
     * SuperAdmins can always edit. Otherwise, the user must be the owner
     * or a collaborator of the organization (matched via Customer.user).
     */
    async canEditOrganization(ctx: RequestContext, organizationId: ID): Promise<boolean> {
        if (this.isSuperAdmin(ctx)) {
            return true;
        }

        const activeUserId = ctx.activeUserId;
        if (!activeUserId) {
            return false;
        }

        const org = await this.connection.getRepository(ctx, Organization).findOne({
            where: { id: organizationId },
            relations: ['owner', 'owner.user', 'collaborators', 'collaborators.user'],
        });

        if (!org) {
            return false;
        }

        if (org.owner?.user?.id === activeUserId) {
            return true;
        }

        if (org.collaborators?.some(c => c.user?.id === activeUserId)) {
            return true;
        }

        return false;
    }

    /**
     * Resolves the organization ID from an address ID, then checks edit permission.
     */
    async assertCanEditOrganizationByAddress(ctx: RequestContext, addressId: ID): Promise<void> {
        const address = await this.connection.getRepository(ctx, OrganizationAddress).findOne({
            where: { id: addressId },
            relations: ['organization'],
        });

        if (!address?.organization) {
            throw new ForbiddenError();
        }

        await this.assertCanEditOrganization(ctx, address.organization.id);
    }

    /**
     * Throws ForbiddenError if the active user cannot edit the organization.
     */
    async assertCanEditOrganization(ctx: RequestContext, organizationId: ID): Promise<void> {
        const canEdit = await this.canEditOrganization(ctx, organizationId);
        if (!canEdit) {
            throw new ForbiddenError();
        }
    }

    private isSuperAdmin(ctx: RequestContext): boolean {
        return ctx.userHasPermissions(['SuperAdmin' as any]);
    }
}
