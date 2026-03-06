import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let authServiceSpy: { register: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = { register: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should detect password mismatch', () => {
    component.form.setValue({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });

    expect(component.form.hasError('passwordMismatch')).toBe(true);
    expect(component.form.controls.confirmPassword.hasError('passwordMismatch')).toBe(true);
  });

  it('should have a valid form when all fields are correct', () => {
    component.form.setValue({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(component.form.valid).toBe(true);
  });

  it('should call authService.register without confirmPassword and navigate on success', () => {
    const mockResponse = { accessToken: 'token', refreshToken: 'refresh' };
    authServiceSpy.register.mockReturnValue(of(mockResponse));

    component.form.setValue({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set error on register failure', () => {
    authServiceSpy.register.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already registered' } })),
    );

    component.form.setValue({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();

    expect(component.error()).toBe('Email already registered');
    expect(component.loading()).toBe(false);
  });

  it('should not call register when form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });
});
