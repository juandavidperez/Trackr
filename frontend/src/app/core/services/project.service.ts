import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectRequest, ProjectResponse, AddMemberRequest, ProjectMember } from '../models/project.model';
import { Page } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  getAll(page?: number, size?: number): Observable<Page<ProjectResponse>> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', page.toString());
    if (size != null) params = params.set('size', size.toString());
    return this.http.get<Page<ProjectResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.baseUrl}/${id}`);
  }

  create(project: ProjectRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(this.baseUrl, project);
  }

  update(id: number, project: ProjectRequest): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.baseUrl}/${id}`, project);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getMembers(projectId: number): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${this.baseUrl}/${projectId}/members`);
  }

  addMember(projectId: number, request: AddMemberRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${projectId}/members`, request);
  }

  removeMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}/members/${userId}`);
  }
}
