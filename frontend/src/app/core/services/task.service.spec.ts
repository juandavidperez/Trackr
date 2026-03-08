import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskService } from './task.service';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const apiUrl = environment.apiUrl;

  const sampleTask = {
    id: 1,
    title: 'Test Task',
    description: 'A test task',
    status: 'TODO' as const,
    priority: 'HIGH' as const,
    dueDate: '2026-04-01',
    assigneeName: 'Alice',
    projectId: 10,
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-03-01T00:00:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- getByProject ---

  describe('getByProject', () => {
    it('should GET /projects/:id/tasks without filters', () => {
      service.getByProject(10).subscribe((tasks) => {
        expect(tasks).toEqual([sampleTask]);
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/10/tasks`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([sampleTask]);
    });

    it('should append status filter as query param', () => {
      service.getByProject(10, { status: 'TODO' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/projects/10/tasks`);
      expect(req.request.params.get('status')).toBe('TODO');
      req.flush([]);
    });

    it('should append priority filter as query param', () => {
      service.getByProject(10, { priority: 'HIGH' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/projects/10/tasks`);
      expect(req.request.params.get('priority')).toBe('HIGH');
      req.flush([]);
    });

    it('should append assigneeId filter as query param', () => {
      service.getByProject(10, { assigneeId: 5 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/projects/10/tasks`);
      expect(req.request.params.get('assigneeId')).toBe('5');
      req.flush([]);
    });

    it('should append search filter as query param', () => {
      service.getByProject(10, { search: 'navbar' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/projects/10/tasks`);
      expect(req.request.params.get('search')).toBe('navbar');
      req.flush([]);
    });

    it('should append sort params as query params', () => {
      service.getByProject(10, { sortBy: 'dueDate', sortDir: 'asc' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/projects/10/tasks`);
      expect(req.request.params.get('sortBy')).toBe('dueDate');
      expect(req.request.params.get('sortDir')).toBe('asc');
      req.flush([]);
    });

    it('should append all filters as query params', () => {
      service
        .getByProject(10, {
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          assigneeId: 3,
          search: 'test',
          sortBy: 'priority',
          sortDir: 'desc',
        })
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/projects/10/tasks`);
      expect(req.request.params.get('status')).toBe('IN_PROGRESS');
      expect(req.request.params.get('priority')).toBe('MEDIUM');
      expect(req.request.params.get('assigneeId')).toBe('3');
      expect(req.request.params.get('search')).toBe('test');
      expect(req.request.params.get('sortBy')).toBe('priority');
      expect(req.request.params.get('sortDir')).toBe('desc');
      req.flush([]);
    });
  });

  // --- create ---

  describe('create', () => {
    it('should POST to /projects/:id/tasks with request body', () => {
      const request = { title: 'New Task', description: 'Desc', priority: 'MEDIUM' as const };

      service.create(10, request).subscribe((task) => {
        expect(task).toEqual(sampleTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/10/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(sampleTask);
    });
  });

  // --- update ---

  describe('update', () => {
    it('should PUT to /tasks/:id with request body', () => {
      const request = { title: 'Updated Task' };

      service.update(1, request).subscribe((task) => {
        expect(task).toEqual(sampleTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(sampleTask);
    });
  });

  // --- updateStatus ---

  describe('updateStatus', () => {
    it('should PATCH to /tasks/:id/status with status request', () => {
      const request = { status: 'DONE' as const };

      service.updateStatus(1, request).subscribe((task) => {
        expect(task).toEqual(sampleTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(request);
      req.flush(sampleTask);
    });
  });

  // --- delete ---

  describe('delete', () => {
    it('should DELETE /tasks/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/tasks/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
