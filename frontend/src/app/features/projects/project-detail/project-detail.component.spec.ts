import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ProjectDetailComponent } from './project-detail.component';
import { environment } from '../../../../environments/environment';
import { TaskResponse } from '../../../core/models/task.model';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let httpMock: HttpTestingController;

  const mockProject = {
    id: 1,
    name: 'Test Project',
    description: 'Project Description',
    ownerName: 'Owner',
    ownerEmail: 'owner@test.com',
    memberCount: 1,
    createdAt: '2024-01-01T00:00:00'
  };

  const mockTasks: TaskResponse[] = [
    { id: 1, title: 'Task 1', status: 'TODO', position: 1000, priority: 'MEDIUM', description: '', projectId: 1, projectName: 'Test', createdAt: '', updatedAt: '', assigneeName: null, dueDate: null },
    { id: 2, title: 'Task 2', status: 'TODO', position: 2000, priority: 'MEDIUM', description: '', projectId: 1, projectName: 'Test', createdAt: '', updatedAt: '', assigneeName: null, dueDate: null },
    { id: 3, title: 'Task 3', status: 'IN_PROGRESS', position: 1000, priority: 'MEDIUM', description: '', projectId: 1, projectName: 'Test', createdAt: '', updatedAt: '', assigneeName: null, dueDate: null },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } }
          }
        }
      ],
    });

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    
    // Initial data load
    fixture.detectChanges();
    
    // Mock project request
    const projectReq = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
    projectReq.flush(mockProject);
    
    // Mock tasks request
    const tasksReq = httpMock.expectOne(r => r.url.includes('/projects/1/tasks'));
    tasksReq.flush({ content: mockTasks });
    
    // Mock members request
    const membersReq = httpMock.expectOne(`${environment.apiUrl}/projects/1/members`);
    membersReq.flush([]);
    
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate new position for intra-column reorder (middle)', () => {
    const taskToMove = mockTasks[0];
    const column = { data: 'TODO' };
    const event = {
      item: { data: taskToMove },
      previousContainer: column,
      container: column,
      previousIndex: 0,
      currentIndex: 1
    } as any;

    component.onTaskDrop(event);

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/position`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.position).toBe(2750);
    req.flush({ ...taskToMove, position: 2750 });
  });

  it('should calculate new position for intra-column reorder (start)', () => {
    const taskToMove = mockTasks[1];
    const column = { data: 'TODO' };
    const event = {
      item: { data: taskToMove },
      previousContainer: column,
      container: column,
      previousIndex: 1,
      currentIndex: 0
    } as any;

    component.onTaskDrop(event);

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/2/position`);
    expect(req.request.body.position).toBe(250);
    req.flush({ ...taskToMove, position: 250 });
  });

  it('should handle cross-column move by calling updateStatus', () => {
    const taskToMove = mockTasks[0];
    const event = {
      item: { data: taskToMove },
      previousContainer: { data: 'TODO' },
      container: { data: 'IN_PROGRESS' },
      previousIndex: 0,
      currentIndex: 0
    } as any;

    component.onTaskDrop(event);

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.status).toBe('IN_PROGRESS');
    req.flush({ ...taskToMove, status: 'IN_PROGRESS' });
  });

  it('should show disabled state and revert on error', () => {
    const taskToMove = mockTasks[0];
    const column = { data: 'TODO' };
    const event = {
      item: { data: taskToMove },
      previousContainer: column,
      container: column,
      previousIndex: 0,
      currentIndex: 1
    } as any;

    component.onTaskDrop(event);

    expect(component.currentlyUpdatingTaskIds().has(taskToMove.id)).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/position`);
    req.error(new ErrorEvent('Network error'), { status: 500 });

    expect(component.currentlyUpdatingTaskIds().has(taskToMove.id)).toBe(false);
    expect(component.tasks().find(t => t.id === 1)?.position).toBe(1000);
  });
  
  it('should suppress animation on drop', () => {
    const taskToMove = mockTasks[0];
    const column = { data: 'TODO' };
    const event = {
      item: { data: taskToMove },
      previousContainer: column,
      container: column,
      previousIndex: 0,
      currentIndex: 1
    } as any;

    vi.useFakeTimers();
    component.onTaskDrop(event);
    expect(component.recentlyDroppedIds().has(taskToMove.id)).toBe(true);

    vi.advanceTimersByTime(50);
    expect(component.recentlyDroppedIds().has(taskToMove.id)).toBe(false);
    
    httpMock.expectOne(`${environment.apiUrl}/tasks/1/position`).flush({});
    vi.useRealTimers();
  });
});
