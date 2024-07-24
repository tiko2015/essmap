import { gql } from "apollo-angular";

const GET_CHANNELS = gql`
    query {
      channels {
        code
        token
        customFields {
          nombre
          zoneStore
          description
          storeEnabled
          geolocationStore
          imgLogo {
            preview
          }
        }
      }
    }
`;

export { GET_CHANNELS }
