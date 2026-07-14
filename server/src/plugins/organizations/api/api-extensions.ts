import gql from 'graphql-tag';

const organizationTypeAdminApiExtensions = gql`
  type OrganizationType implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    name: String!
    organizations: [Organization]
    logo: Asset
  }

  type OrganizationTypeList implements PaginatedList {
    items: [OrganizationType!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input OrganizationTypeListOptions

  extend type Query {
    organizationType(id: ID!): OrganizationType
    organizationTypes(options: OrganizationTypeListOptions): OrganizationTypeList!
  }

  input CreateOrganizationTypeInput {
    code: String!
    name: String!
  }

  input UpdateOrganizationTypeInput {
    id: ID!
    code: String
    name: String
    logo: ID
  }

  extend type Mutation {
    createOrganizationType(input: CreateOrganizationTypeInput!): OrganizationType!
    updateOrganizationType(input: UpdateOrganizationTypeInput!): OrganizationType!
    deleteOrganizationType(id: ID!): DeletionResponse!
  }
`;
const organizationAddressAdminApiExtensions = gql`
  scalar Point

  type OrganizationAddress implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    fullName: String!
    streetLine1: String!
    streetLine2: String!
    city: String!
    province: Province
    postalCode: String!
    phoneNumber: String!
    organization: Organization
    country: Country
    location: Point
  }

  type OrganizationAddressList implements PaginatedList {
    items: [OrganizationAddress!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input OrganizationAddressListOptions

  extend type Query {
    organizationAddress(id: ID!): OrganizationAddress
    organizationAddresses(options: OrganizationAddressListOptions): OrganizationAddressList!
    organizationAddressesByDistance(
      options: OrganizationAddressListOptions,
      longitude: Float!,
      latitude: Float!
    ): OrganizationAddressList!
  }

  input OrganizationAddressFilterParameter {
    organizationName: StringOperators
    organizationType: IDOperators
    province: IDOperators
  }

  input PointInput {
    latitude: Float!
    longitude: Float!
  }

  input CreateOrganizationAddressInput {
    fullName: String!
    streetLine1: String!
    streetLine2: String!
    city: String!
    province: ID
    postalCode: String!
    phoneNumber: String!
    organization: ID!
    country: ID!
    location: PointInput
  }

  input UpdateOrganizationAddressInput {
    id: ID!
    fullName: String
    streetLine1: String
    streetLine2: String
    city: String
    province: ID
    postalCode: String
    phoneNumber: String
    organization: ID
    country: ID
    location: PointInput
  }

  extend type Mutation {
    createOrganizationAddress(input: CreateOrganizationAddressInput!): OrganizationAddress!
    updateOrganizationAddress(input: UpdateOrganizationAddressInput!): OrganizationAddress!
    deleteOrganizationAddress(id: ID!): DeletionResponse!
    setDefaultOrganizationAddress(organizationId: ID!, addressId: ID!): Organization!
  }
`;
const organizationBranchAdminApiExtensions = gql`
  type OrganizationBranch implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    name: String!
    description: String
    enabled: Boolean!
    isPrivate: Boolean!
    isRoot: Boolean!
    logo: Asset
    organizations: [Organization!]
  }

  type OrganizationBranchList implements PaginatedList {
    items: [OrganizationBranch!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input OrganizationBranchListOptions

  extend type Query {
    organizationBranch(id: ID!): OrganizationBranch
    organizationBranchs(options: OrganizationBranchListOptions): OrganizationBranchList!
  }

  input CreateOrganizationBranchInput {
    code: String!
    name: String!
    description: String
    enabled: Boolean
    isPrivate: Boolean
    isRoot: Boolean
    logoId: ID
  }

  input UpdateOrganizationBranchInput {
    id: ID!
    code: String
    name: String
    description: String
    enabled: Boolean
    isPrivate: Boolean
    isRoot: Boolean
    logoId: ID
  }

  extend type Mutation {
    createOrganizationBranch(input: CreateOrganizationBranchInput!): OrganizationBranch!
    updateOrganizationBranch(input: UpdateOrganizationBranchInput!): OrganizationBranch!
    deleteOrganizationBranch(id: ID!): DeletionResponse!
  }
`;
const organizationAdminApiExtensions = gql`
  type Organization implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    code: String!
    name: String!
    enabled: Boolean!
    description: String!
    email: String!
    owner: Customer
    type: OrganizationType
    branches: [OrganizationBranch]
    collaborators: [Customer]
    affiliatedWith: [Organization]
    products: [Product]
    linksRRSS: [String]
    addresses: [OrganizationAddress]
    defaultAddress: OrganizationAddress
    logo: Asset
    banner: Asset
  }

  type OrganizationList implements PaginatedList {
    items: [Organization!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input OrganizationListOptions

  extend type Query {
    organization(id: ID!): Organization
    organizationByCode(code: String!): Organization
    organizations(options: OrganizationListOptions): OrganizationList!
    canEditOrganization(id: ID!): Boolean!
    organizationsByDistance(
      options: OrganizationListOptions,
      longitude: Float,
      latitude: Float,
      hasProducts: Boolean
    ): OrganizationList!
  }

  input OrganizationFilterParameter {
    province: IDOperators
    typeId: IDOperators
  }

  input CreateOrganizationInput {
    code: String
    name: String
    enabled: Boolean!
    description: String!
    email: String!
    ownerId: ID
    collaboratorsId: [ID!]
    branchesId: [ID!]
    logoId: ID!
    bannerId: ID
    linksRRSS: [String!]
  }

  input UpdateOrganizationInput {
    id: ID!
    code: String
    name: String
    enabled: Boolean
    description: String
    email: String
    linksRRSS: [String!]
    ownerId: ID
    typeId: ID
    collaboratorsId: [ID!]
    branchesId: [ID!]
    affiliatedWithId: [ID!]
    addressesId: [ID!]
    defaultAddressId: ID
    logoId: ID
    bannerId: ID
  }

  extend type Mutation {
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganization(input: UpdateOrganizationInput!): Organization!
    deleteOrganization(id: ID!): DeletionResponse!
  }
`;

const provinceApiExtensions = gql`
  input ProvinceListOptions

  extend type Query {
    provinces(options: ProvinceListOptions): ProvinceList!
    province(id: ID!): Province
  }
`;

export const adminApiExtensions = gql`
  ${organizationAddressAdminApiExtensions}
  ${organizationBranchAdminApiExtensions}
  ${organizationAdminApiExtensions}
  ${organizationTypeAdminApiExtensions}
`;
export const shopApiExtensions = gql`
  ${organizationAddressAdminApiExtensions}
  ${organizationBranchAdminApiExtensions}
  ${organizationAdminApiExtensions}
  ${organizationTypeAdminApiExtensions}
  ${provinceApiExtensions}
`;
