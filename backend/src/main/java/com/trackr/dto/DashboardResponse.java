package com.trackr.dto;

import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private TasksByStatus tasksByStatus;
    private int overdueTasks;
    private int assignedTasks;
    private int activeProjects;
    private int completedLast7Days;
    private List<DashboardTask> overdueTaskList;
    private List<DashboardTask> recentTaskList;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TasksByStatus {
        private int todo;
        private int inProgress;
        private int done;
    }

    @Getter
    @AllArgsConstructor
    public static class DashboardTask {
        private Long id;
        private String title;
        private TaskStatus status;
        private TaskPriority priority;
        private LocalDate dueDate;
        private Long projectId;
        private String projectName;
        private LocalDateTime createdAt;
    }
}
