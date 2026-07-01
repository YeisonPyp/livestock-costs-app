// src/features/profile/services/profile.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { User, ChangePasswordPayload, PersonUpdateSelfPayload } from '../../users/models/user.model';


@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private api = inject(ApiService);
  private endpoint = '/users/users/';

  // ── Perfil (User) ───────────────────────────────────────────────

  getMe(): Observable<ApiResponse<User>> {
    return this.api.get<User>(`${this.endpoint}me/`);
  }

  updateMyUser(data: { username?: string; metadata?: any }): Observable<ApiResponse<User>> {
    return this.api.patch<User>(`${this.endpoint}me/`, data);
  }

  updateMyPerson(data: PersonUpdateSelfPayload): Observable<ApiResponse<User>> {
    return this.api.patch<User>(`${this.endpoint}me/person/`, data);
  }

  changePassword(data: ChangePasswordPayload): Observable<ApiResponse<void>> {
    return this.api.post<void>(
      `${this.endpoint}me/change-password/`,
      data
    );
  }

  // ── Avatar ──────────────────────────────────────────────────────

  uploadAvatar(file: File): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.api.post<User>(
      `${this.endpoint}me/upload-avatar/`,
      formData
    );
  }

  deleteAvatar(): Observable<ApiResponse<User>> {
    return this.api.delete<User>(`${this.endpoint}me/avatar/`);
  }

}