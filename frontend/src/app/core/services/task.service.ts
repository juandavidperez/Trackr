import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TaskRequest, TaskResponse, TaskStatusRequest, TaskFilterParams } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getByProject(projectId: number, filters?: TaskFilterParams): Observable<TaskResponse[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.assigneeId) params = params.set('assigneeId', filters.assigneeId.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    }

    return this.http.get<TaskResponse[]>(`${this.apiUrl}/projects/${projectId}/tasks`, { params });
  }

  create(projectId: number, task: TaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.apiUrl}/projects/${projectId}/tasks`, task);
  }

  update(taskId: number, task: TaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/tasks/${taskId}`, task);
  }

  updateStatus(taskId: number, request: TaskStatusRequest): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${this.apiUrl}/tasks/${taskId}/status`, request);
  }

  delete(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}`);
  }
}
