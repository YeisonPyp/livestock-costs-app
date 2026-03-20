import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DocumentType } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private api = inject(ApiService);
  private base = '/users/';

  getDocumentTypes(): Observable<ApiResponse<DocumentType[]>> {
    return this.api.get(`${this.base}document-types/`);
  }

  getCountries() {
    return this.api.get(`${this.base}countries/`);
  }

  getStates(country?: string) {
    return this.api.get(`${this.base}states/`, { country });
  }

  getStatesByCountry(code: string) {
    return this.api.get(`${this.base}states/by-country/${code}/`);
  }

  getCities(state?: string) {
    return this.api.get(`${this.base}cities/`, { state });
  }

  getCitiesByState(code: string) {
    return this.api.get(`${this.base}cities/by-state/${code}/`);
  }

  getGenders() {
    return this.api.get(`${this.base}genders/`);
  }
}