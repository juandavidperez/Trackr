import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { AuthService } from '../../core/services/auth.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let authServiceSpy: {
    currentUser: ReturnType<typeof signal>;
    isAuthenticated: ReturnType<typeof signal>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceSpy = {
      currentUser: signal({ id: 1, name: 'John Doe', email: 'john@example.com', role: 'MEMBER', createdAt: '' }),
      isAuthenticated: signal(true),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    const fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebarOpen', () => {
    expect(component.sidebarOpen()).toBe(false);
    component.sidebarOpen.set(true);
    expect(component.sidebarOpen()).toBe(true);
  });

  it('should return correct user initials', () => {
    expect(component.userInitials()).toBe('JD');
  });

  it('should return "?" when no user', () => {
    authServiceSpy.currentUser.set(null);
    expect(component.userInitials()).toBe('?');
  });

  it('should return single initial for single name', () => {
    authServiceSpy.currentUser.set({ id: 1, name: 'Alice', email: 'a@b.com', role: 'MEMBER', createdAt: '' });
    expect(component.userInitials()).toBe('A');
  });
});
