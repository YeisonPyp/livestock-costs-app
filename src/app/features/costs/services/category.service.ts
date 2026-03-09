import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Category, CategoryTree } from '../models/cost.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private api = inject(ApiService);
  private base = 'costs/categories';

  getAll(params?: Record<string, any>): Observable<ApiResponse<Category[]>> {
    return this.api.get(`${this.base}/`, params);
  }

  getById(id: number): Observable<ApiResponse<Category>> {
    return this.api.get(`${this.base}/${id}/`);
  }

  create(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.api.post(`${this.base}/`, data);
  }

  update(id: number, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.api.put(`${this.base}/${id}/`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.base}/${id}/`);
  }

  /** Full hierarchy tree */
  getTree(): Observable<ApiResponse<CategoryTree[]>> {
    return this.api.get(`${this.base}/tree/`);
  }

  /** Only leaf categories where costs can be recorded (is_movement=true) */
  getMovable(): Observable<ApiResponse<Category[]>> {
    return this.api.get(`${this.base}/movable/`);
  }

  /** Next available code given an optional parent */
  getNextCode(parentId?: number): Observable<ApiResponse<string>> {
    const params = parentId ? { parent_id: parentId } : {};
    return this.api.get(`${this.base}/next-code/`, params);
  }
}