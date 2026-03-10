import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET dashboard stats', () => {
    const mockResponse = {
      tasksByStatus: { todo: 3, inProgress: 2, done: 5 },
      overdueTasks: 1,
      assignedTasks: 10,
      activeProjects: 2,
      completedLast7Days: 4,
      overdueTaskList: [],
      recentTaskList: [],
    };

    service.getStats().subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
