declare module 'virtual:vendure-ui-config' {
  export const uiConfig: any;
}

declare module 'virtual:admin-api-schema' {
  export const schemaInfo: any;
}

declare module 'virtual:dashboard-extensions' {
  export function runDashboardExtensions(...args: any[]): any;
}

declare module 'virtual:plugin-translations' {
  const pluginTranslations: Record<string, any>;
  export default pluginTranslations;
}

declare module 'virtual:admin-api-schema' {
  export const schemaInfo: any;
}
