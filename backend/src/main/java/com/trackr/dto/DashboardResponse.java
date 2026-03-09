package com.trackr.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TasksByStatus {
        private int todo;
        private int inProgress;
        private int done;
    }
}
