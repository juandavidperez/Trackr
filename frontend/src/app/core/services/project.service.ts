import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectRequest, ProjectResponse, AddMemberRequest } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  getAll(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(this.baseUrl);
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

  addMember(projectId: number, request: AddMemberRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${projectId}/members`, request);
  }

  removeMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}/members/${userId}`);
  }
}
