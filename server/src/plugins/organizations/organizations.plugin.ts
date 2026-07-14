import { PluginCommonModule, Type, VendurePlugin, LanguageCode } from '@vendure/core';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';
import { OrganizationAddressAdminResolver } from './api/organization-address-admin.resolver';
import { OrganizationAddressResolver } from './api/organization-address.resolver';
import { OrganizationAdminResolver, OrganizationFieldResolver } from './api/organization-admin.resolver';
import { OrganizationShopResolver } from './api/organization-shop.resolver';
import { OrganizationBranchAdminResolver } from './api/organization-branch-admin.resolver';
import { OrganizationTypeAdminResolver } from './api/organization-type-admin.resolver';
import { ProvinceResolver } from './api/province.resolver';
import { ORGANIZATIONS_PLUGIN_OPTIONS, organizationPermission } from './constants';
import { OrganizationAddress } from './entities/organization-address.entity';
import { OrganizationBranch } from './entities/organization-branch.entity';
import { OrganizationType } from './entities/organization-type.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationAuthService } from './services/organization-auth.service';
import { OrganizationAddressService } from './services/organization-address.service';
import { OrganizationBranchService } from './services/organization-branch.service';
import { OrganizationTypeService } from './services/organization-type.service';
import { OrganizationService } from './services/organization.service';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        { provide: ORGANIZATIONS_PLUGIN_OPTIONS, useFactory: () => OrganizationsPlugin.options },
        OrganizationService,
        OrganizationAuthService,
        OrganizationAddressService,
        OrganizationBranchService,
        OrganizationTypeService,
    ],
    exports: [
        OrganizationService
    ],
    configuration: config => {
        config.authOptions.customPermissions.push(organizationPermission);


        return config;
    },
    compatibility: '^3.0.0',
    entities: [
        OrganizationAddress,
        OrganizationBranch,
        OrganizationType,
        Organization
    ],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [
            OrganizationAddressAdminResolver,
            OrganizationAddressResolver,
            OrganizationBranchAdminResolver,
            OrganizationAdminResolver,
            OrganizationTypeAdminResolver,
            ProvinceResolver
        ]
    },
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [
            OrganizationAddressAdminResolver,
            OrganizationAddressResolver,
            OrganizationBranchAdminResolver,
            OrganizationAdminResolver,
            OrganizationTypeAdminResolver,
            OrganizationFieldResolver,
            OrganizationShopResolver,
            ProvinceResolver,
        ],
    },
})
export class OrganizationsPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<OrganizationsPlugin> {
        this.options = options;
        return OrganizationsPlugin;
    }
}
