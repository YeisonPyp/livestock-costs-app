import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../models/user.interface';
import { LoginRequest } from '../models/login-request.interface';
import { AuthResponse, RefreshTokenResponse } from '../models/auth-response.interface';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private apiService: ApiService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.apiService.post<AuthResponse>('/auth/login/', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  /**
   * Refrescar el access token usando el refresh token
   */
  // refreshToken(): Observable<RefreshTokenResponse> {
  //   const refreshToken = this.getRefreshToken();
    
  //   if (!refreshToken) {
  //     this.logout();
  //     return throwError(() => new Error('No refresh token available'));
  //   }

  //   return this.apiService.post<RefreshTokenResponse>(`/auth/refresh/`, {
  //     refresh: refreshToken
  //   }).pipe(
  //     tap(response => {
  //       if (response.success && response.data) {
  //         // Actualizamos solo el access token
  //         localStorage.setItem(environment.tokenKey, response.data.tokens.access);
          
  //         // Si el backend devuelve un nuevo refresh token, lo actualizamos también
  //         if (response.data.tokens.refresh) {
  //           localStorage.setItem(environment.refreshTokenKey, response.data.tokens.refresh);
  //         }
          
  //         this.isRefreshing = false;
  //         this.refreshTokenSubject.next(response.data.tokens.access);
  //       }
  //     }),
  //     catchError(error => {
  //       this.isRefreshing = false;
  //       this.logout();
  //       return throwError(() => error);
  //     })
  //   );
  // }

  refreshToken(): Observable<ApiResponse<RefreshTokenResponse>> {
  const refreshToken = this.getRefreshToken();

  if (!refreshToken) {
    this.logout();
    return throwError(() => new Error('No refresh token available'));
  }

  return this.apiService.post<RefreshTokenResponse>('/auth/refresh/', {
    refresh: refreshToken
  }).pipe(
    tap((response) => {
      if (response.success && response.data) {
        const { access, refresh } = response.data.tokens;

        localStorage.setItem(environment.tokenKey, access);

        if (refresh) {
          localStorage.setItem(environment.refreshTokenKey, refresh);
        }

        this.isRefreshing = false;
        this.refreshTokenSubject.next(access);
      }
    }),
    catchError((error) => {
      this.isRefreshing = false;
      this.logout();
      return throwError(() => error);
    })
  );
}


  private setSession(authData: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, authData.tokens.access);
    localStorage.setItem(environment.refreshTokenKey, authData.tokens.refresh);
    localStorage.setItem('current_user', JSON.stringify(authData.user));
    this.currentUserSubject.next(authData.user);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error parsing user from storage', e);
        this.clearSession();
      }
    }
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.refreshTokenSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Getters para el manejo del refresh
  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  setIsRefreshing(value: boolean): void {
    this.isRefreshing = value;
  }

  getRefreshTokenSubject(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }
}