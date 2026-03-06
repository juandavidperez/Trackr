import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Flush the /me request if a token was present
    const pending = httpMock.match(`${environment.apiUrl}/me`);
    pending.forEach((req) => req.flush(null, { status: 404, statusText: 'Not Found' }));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST to /api/auth/login and store tokens', () => {
      const credentials = { email: 'john@example.com', password: 'password123' };
      const mockResponse = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);

      // Flush /me call triggered by login
      const meReq = httpMock.expectOne(`${environment.apiUrl}/me`);
      meReq.flush({ id: 1, name: 'John', email: 'john@example.com', role: 'MEMBER' });

      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('register', () => {
    it('should POST to /api/auth/register and store tokens', () => {
      const data = { name: 'John', email: 'john@example.com', password: 'password123' };
      const mockResponse = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      service.register(data).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      // Flush /me call triggered by register
      const meReq = httpMock.expectOne(`${environment.apiUrl}/me`);
      meReq.flush({ id: 1, name: 'John', email: 'john@example.com', role: 'MEMBER' });

      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear localStorage, set isAuthenticated false, and navigate to /auth/login', () => {
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('refresh_token', 'token');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('refreshToken', () => {
    it('should POST to /api/auth/refresh and update tokens', () => {
      localStorage.setItem('refresh_token', 'old-refresh-token');
      const mockResponse = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      service.refreshToken().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(mockResponse);

      expect(localStorage.getItem('access_token')).toBe('new-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    });
  });

  describe('getAccessToken / getRefreshToken', () => {
    it('should return tokens from localStorage', () => {
      localStorage.setItem('access_token', 'my-access');
      localStorage.setItem('refresh_token', 'my-refresh');

      expect(service.getAccessToken()).toBe('my-access');
      expect(service.getRefreshToken()).toBe('my-refresh');
    });

    it('should return null when no tokens stored', () => {
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });
});

describe('AuthService (SSR)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return null for tokens when not in browser', () => {
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
