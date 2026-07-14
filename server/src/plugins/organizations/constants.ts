import { CrudPermissionDefinition } from '@vendure/core';

export const ORGANIZATIONS_PLUGIN_OPTIONS = Symbol('ORGANIZATIONS_PLUGIN_OPTIONS');
export const loggerCtx = 'OrganizationsPlugin';
export const organizationPermission = new CrudPermissionDefinition('Organization');