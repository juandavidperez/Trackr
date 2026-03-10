import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { DashboardResponse } from '../../core/models/dashboard.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;

  const mockUser = signal({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'MEMBER' as const,
    createdAt: '',
  });

  const mockDashboardResponse: DashboardResponse = {
    tasksByStatus: { todo: 3, inProgress: 2, done: 5 },
    overdueTasks: 1,
    assignedTasks: 10,
    activeProjects: 2,
    completedLast7Days: 4,
    overdueTaskList: [
      {
        id: 1,
        title: 'Overdue task',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2026-01-01',
        projectId: 10,
        projectName: 'Test Project',
        createdAt: '2026-01-01T00:00:00',
      },
    ],
    recentTaskList: [
      {
        id: 2,
        title: 'Recent task',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        projectId: 10,
        projectName: 'Test Project',
        createdAt: '2026-03-09T00:00:00',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: mockUser.asReadonly(),
            isAuthenticated: signal(true).asReadonly(),
          },
        },
        {
          provide: DashboardService,
          useValue: {
            getStats: () => of(mockDashboardResponse),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    expect(component.data()).toEqual(mockDashboardResponse);
    expect(component.loading()).toBe(false);
  });

  it('should calculate completion rate', () => {
    expect(component.completionRate()).toBe(50);
  });

  it('should return 0 completion rate when no tasks', () => {
    component.data.set({
      ...mockDashboardResponse,
      assignedTasks: 0,
      tasksByStatus: { todo: 0, inProgress: 0, done: 0 },
    });
    expect(component.completionRate()).toBe(0);
  });

  it('should format dates correctly', () => {
    const result = component.formatDate('2026-03-09');
    expect(result).toContain('Mar');
    expect(result).toContain('9');
  });
});
