import { gql } from "apollo-angular";

const GET_CHANNELS = gql`
    query getOrganizationByDistance($latitude: Float!, $longitude: Float!, $take: Float, $name: String, $type: ID) {
        organizationAddressesByDistance(
            take: $take, 
            longitude: $longitude,
            latitude: $latitude,
          	name: $name,
            type: $type
        ) {
            totalItems
            items {
                id
                fullName
                location
                defaultAddress
                province
                streetLine1
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
        defaultAddress
        province
        streetLine1
        organization {
          code
          name
          description
          type {
              id
              name
          }
        }
      }
    }
`;

const GET_TYPES = gql`
    query getTypes {
        organizationTypes {
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
