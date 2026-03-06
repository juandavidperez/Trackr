import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const authReq = addToken(req, authService.getAccessToken());

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing && authService.getRefreshToken()) {
        isRefreshing = true;

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            return next(addToken(req, authService.getAccessToken()));
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            authService.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

function addToken(req: Parameters<HttpInterceptorFn>[0], token: string | null) {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
