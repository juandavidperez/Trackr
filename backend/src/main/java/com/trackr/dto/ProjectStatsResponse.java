package com.trackr.dto;

public record ProjectStatsResponse(
        TasksByStatus tasksByStatus,
        TasksByPriority tasksByPriority,
        int totalTasks,
        int overdue,
        double completionPercentage
) {
    public record TasksByStatus(int todo, int inProgress, int done) {}
    public record TasksByPriority(int low, int medium, int high) {}
}
