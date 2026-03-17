import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { SelectOption } from '../models/cost.model';

@Injectable({ providedIn: 'root' })
export class ChoiceService {
  private api = inject(ApiService);
  private base = '/costs/choices';

  getPaymentMethods() {
    return this.api.get<SelectOption[]>(
      `${this.base}/payment-methods/`
    );
  }

  getPaymentStatus() {
    return this.api.get<SelectOption[]>(
      `${this.base}/payment-status/`
    );
  }

  getCostTypes() {
    return this.api.get<SelectOption[]>(
      `${this.base}/cost-types/`
    );
  }
}