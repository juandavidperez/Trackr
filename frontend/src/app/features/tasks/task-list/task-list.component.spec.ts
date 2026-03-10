import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TaskListComponent } from './task-list.component';
import { environment } from '../../../../environments/environment';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading()).toBe(true);
  });

  it('should load tasks and projects on init', () => {
    const mockTasks = {
      content: [
        {
          id: 1,
          title: 'My Task',
          description: '',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: null,
          assigneeName: 'Alice',
          projectId: 1,
          projectName: 'Project A',
          createdAt: '2024-01-01T00:00:00',
          updatedAt: '2024-01-01T00:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    };
    const mockProjects = {
      content: [{ id: 1, name: 'Project A', description: '', ownerName: 'John', ownerEmail: 'j@t.com', memberCount: 1, createdAt: '2024-01-01T00:00:00' }],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
    };

    fixture.detectChanges();

    const reqs = httpMock.match(() => true);
    const tasksReq = reqs.find((r) => r.request.url.includes('/tasks/me'));
    const projectsReq = reqs.find((r) => r.request.url.includes('/projects'));

    tasksReq!.flush(mockTasks);
    projectsReq!.flush(mockProjects);

    expect(component.loading()).toBe(false);
    expect(component.tasks().length).toBe(1);
    expect(component.tasks()[0].title).toBe('My Task');
  });

  it('should show empty state when no tasks', () => {
    fixture.detectChanges();

    const reqs = httpMock.match(() => true);
    const tasksReq = reqs.find((r) => r.request.url.includes('/tasks/me'));
    const projectsReq = reqs.find((r) => r.request.url.includes('/projects'));

    tasksReq!.flush({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 });
    projectsReq!.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No tasks assigned');
  });
});
