import { gql } from "apollo-angular";

const GET_CHANNELS = gql`
    query getOrganizationByDistance(
        $latitude: Float!, 
        $longitude: Float!, 
        $take: Int, 
        $name: String, 
        $type: String,
        $province: String,
    ) {
        organizationAddressesByDistance(
            options: { 
                take: $take,
                filter:  {
                    organizationType: {eq:$type},
                    organizationName: {contains:$name},
                    province: {eq:$province},
                }
            }
            longitude: $longitude,
            latitude: $latitude,
        ) {
            totalItems
            items {
                id
                fullName
                location
                province {
                    id
                    code
                }
                streetLine1
                streetLine2
                organization {
                    code
                    name
                    description
                    type {
                        code
                    }
                }
            }
        }
    }
`;

const GET_CHANNEL = gql`
    query getOrganizationAddress($id: ID!) {
      organizationAddress(id: $id) {
        id
        fullName
        location
        province {
            code
        }
        streetLine1
        streetLine2
        organization {
          code
          name
          description
          type {
              id
              code
              name
          }
        }
      }
    }
`;

const GET_TYPES = gql`
    query getTypes{
        organizationTypes(options: {take: 25})  {
            items {
                name
                id
                code
            }
        }
    }
`;
export { GET_CHANNEL }
export { GET_CHANNELS }
export { GET_TYPES }
