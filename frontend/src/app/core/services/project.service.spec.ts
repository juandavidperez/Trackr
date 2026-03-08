import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProjectService } from './project.service';
import { environment } from '../../../environments/environment';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/projects`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- getAll ---

  describe('getAll', () => {
    it('should GET /projects and return project list', () => {
      const mockProjects = [
        { id: 1, name: 'Project A', description: 'Desc A', ownerName: 'John', ownerEmail: 'john@example.com', memberCount: 3, createdAt: '2026-01-01T00:00:00' },
        { id: 2, name: 'Project B', description: 'Desc B', ownerName: 'Jane', ownerEmail: 'jane@example.com', memberCount: 1, createdAt: '2026-01-02T00:00:00' },
      ];

      service.getAll().subscribe((projects) => {
        expect(projects).toEqual(mockProjects);
        expect(projects.length).toBe(2);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });
  });

  // --- getById ---

  describe('getById', () => {
    it('should GET /projects/:id and return a single project', () => {
      const mockProject = { id: 1, name: 'Project A', description: 'Desc', ownerName: 'John', ownerEmail: 'john@example.com', memberCount: 2, createdAt: '2026-01-01T00:00:00' };

      service.getById(1).subscribe((project) => {
        expect(project).toEqual(mockProject);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProject);
    });
  });

  // --- create ---

  describe('create', () => {
    it('should POST to /projects with request body', () => {
      const request = { name: 'New Project', description: 'A new project' };
      const mockResponse = { id: 3, name: 'New Project', description: 'A new project', ownerName: 'John', ownerEmail: 'john@example.com', memberCount: 1, createdAt: '2026-03-08T00:00:00' };

      service.create(request).subscribe((project) => {
        expect(project).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // --- update ---

  describe('update', () => {
    it('should PUT to /projects/:id with request body', () => {
      const request = { name: 'Updated Project', description: 'Updated desc' };
      const mockResponse = { id: 1, name: 'Updated Project', description: 'Updated desc', ownerName: 'John', ownerEmail: 'john@example.com', memberCount: 2, createdAt: '2026-01-01T00:00:00' };

      service.update(1, request).subscribe((project) => {
        expect(project).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // --- delete ---

  describe('delete', () => {
    it('should DELETE /projects/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // --- getMembers ---

  describe('getMembers', () => {
    it('should GET /projects/:id/members and return member list', () => {
      const mockMembers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'ADMIN' },
        { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'MEMBER' },
      ];

      service.getMembers(5).subscribe((members) => {
        expect(members).toEqual(mockMembers);
        expect(members.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/5/members`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMembers);
    });
  });

  // --- addMember ---

  describe('addMember', () => {
    it('should POST to /projects/:id/members with email', () => {
      const request = { email: 'new@example.com' };

      service.addMember(5, request).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/5/members`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(null);
    });
  });

  // --- removeMember ---

  describe('removeMember', () => {
    it('should DELETE /projects/:id/members/:userId', () => {
      service.removeMember(5, 3).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/5/members/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
