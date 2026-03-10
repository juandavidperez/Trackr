import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProjectListComponent } from './project-list.component';
import { environment } from '../../../../environments/environment';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
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

  it('should load projects on init', () => {
    const mockPage = {
      content: [
        {
          id: 1,
          name: 'Test Project',
          description: 'Desc',
          ownerName: 'John',
          ownerEmail: 'john@test.com',
          memberCount: 2,
          createdAt: '2024-01-01T00:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    };

    fixture.detectChanges(); // triggers ngOnInit

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.apiUrl}/projects`));
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);

    expect(component.loading()).toBe(false);
    expect(component.projects().length).toBe(1);
    expect(component.projects()[0].name).toBe('Test Project');
  });

  it('should show empty state when no projects', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.includes(`${environment.apiUrl}/projects`));
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No projects yet');
  });
});
