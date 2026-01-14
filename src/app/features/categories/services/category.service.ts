import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Category, CategoryTree } from '../models/category.interface';
import { ApiResponse } from '../../../core/models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private apiService: ApiService) {}

  getCategories(params?: any): Observable<ApiResponse<Category[]>> {
    return this.apiService.get<Category[]>('/costs/categories/', params);
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.apiService.get<Category>(`/costs/categories/${id}/`);
  }

  getCategoryTree(): Observable<ApiResponse<CategoryTree[]>> {
    return this.apiService.get<CategoryTree[]>('/costs/categories/tree/');
  }

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.apiService.post<Category>('/costs/categories/', category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.apiService.put<Category>(`/costs/categories/${id}/`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<any>(`/costs/categories/${id}/`);
  }
}
