import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;

  const mockUser = signal({ id: 1, name: 'John Doe', email: 'john@example.com', role: 'MEMBER' as const, createdAt: '' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: mockUser.asReadonly(),
            isAuthenticated: signal(true).asReadonly(),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to user name via authService', () => {
    expect(component.authService.currentUser()?.name).toBe('John Doe');
  });
});
