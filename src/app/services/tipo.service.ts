import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_TYPES } from './graphql.operations';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface OrganizationType {
  name: string;
  id: string;
}

interface GetTypesResponse {
  organizationTypes: {
    items: OrganizationType[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class TipoService {

  constructor(private apollo: Apollo) { }

  findAll(): Observable<OrganizationType[]> {
    return this.apollo.query<GetTypesResponse>({
      query: GET_TYPES
    }).pipe(
      map(result => result.data.organizationTypes.items)
    );
  }

}
