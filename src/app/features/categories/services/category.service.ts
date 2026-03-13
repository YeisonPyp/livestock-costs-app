import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Category, CategoryTree } from '../models/category.interface';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private apiService: ApiService) {}

  getCategories(params?: any): Observable<ApiResponse<Category[]>> {
    return this.apiService.get<Category[]>('/costs/categories/', params);
  }

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.apiService.post<Category>('/costs/categories/', category);
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.apiService.get<Category>(`/costs/categories/${id}/`);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.apiService.put<Category>(`/costs/categories/${id}/`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<any>(`/costs/categories/${id}/`);
  }
  
  getCategoryTree(): Observable<ApiResponse<CategoryTree[]>> {
    return this.apiService.get<CategoryTree[]>('/costs/categories/tree/');
  }

  getCategoryMovable(): Observable<ApiResponse<Category[]>> {
    return this.apiService.get<Category[]>('/costs/categories/movable/');
  }

  getNextCategoryCode(parentId?: number): Observable<ApiResponse<string>> {
    const params = parentId ? { parent_id: parentId } : {};
    return this.apiService.get<string>('/costs/categories/next-code/', params);
  }
}
