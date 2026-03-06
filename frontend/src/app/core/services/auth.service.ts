import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshRequest } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly _isAuthenticated = signal(this.hasToken());

  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => this.storeTokens(response)),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, data).pipe(
      tap((response) => this.storeTokens(response)),
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const body: RefreshRequest = { refreshToken: refreshToken ?? '' };
    return this.http.post<AuthResponse>(`${this.authUrl}/refresh`, body).pipe(
      tap((response) => this.storeTokens(response)),
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private storeTokens(response: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    this._isAuthenticated.set(true);
  }
}
