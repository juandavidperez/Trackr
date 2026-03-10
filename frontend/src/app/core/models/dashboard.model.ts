import { TaskStatus, TaskPriority } from './task.model';

export interface DashboardResponse {
  tasksByStatus: TasksByStatus;
  overdueTasks: number;
  assignedTasks: number;
  activeProjects: number;
  completedLast7Days: number;
  overdueTaskList: DashboardTask[];
  recentTaskList: DashboardTask[];
}

export interface TasksByStatus {
  todo: number;
  inProgress: number;
  done: number;
}

export interface DashboardTask {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: number;
  projectName: string;
  createdAt: string;
}
