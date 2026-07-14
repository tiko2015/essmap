declare module '@vendure/dashboard' {
  // Minimal ambient types to allow dashboard extension development
  export const api: any;
  export const defineDashboardExtension: (...args: any[]) => any;
  export const Page: any;
  export const PageTitle: any;
  export const PageActionBar: any;
  export const PageActionBarRight: any;
  export const Button: any;
  export const PageLayout: any;
  export const PageBlock: any;
  export const Input: any;
  export const ListPage: any;
  export const DetailPageButton: any;
  export const Badge: any;
  export const FormFieldWrapper: any;
  export const DetailFormGrid: any;
  export const Switch: any;
  export const RichTextInput: any;
  export const CustomFieldsPageBlock: any;
  export const useDetailPage: any;
  export const detailPageRouteLoader: any;
  export type DashboardFormComponent = any;
  export default {} as any;
}
