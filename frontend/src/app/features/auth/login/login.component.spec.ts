import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authServiceSpy: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = { login: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should have a valid form with correct values', () => {
    component.form.setValue({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(component.form.valid).toBe(true);
  });

  it('should mark email as invalid with bad format', () => {
    component.form.controls.email.setValue('not-an-email');
    expect(component.form.controls.email.hasError('email')).toBe(true);
  });

  it('should call authService.login and navigate on success', () => {
    const mockResponse = { accessToken: 'token', refreshToken: 'refresh' };
    authServiceSpy.login.mockReturnValue(of(mockResponse));

    component.form.setValue({ email: 'john@example.com', password: 'password123' });
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set error on login failure', () => {
    authServiceSpy.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );

    component.form.setValue({ email: 'john@example.com', password: 'wrong' });
    component.onSubmit();

    expect(component.error()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });

  it('should not call login when form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });
});
