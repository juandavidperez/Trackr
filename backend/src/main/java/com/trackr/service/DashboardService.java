package com.trackr.service;

import com.trackr.dto.DashboardResponse;
import com.trackr.model.Task;
import com.trackr.model.User;
import com.trackr.model.enums.TaskStatus;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public DashboardResponse getStats(User user) {
        Long userId = user.getId();

        int todo = (int) taskRepository.countByAssigneeIdAndStatus(userId, TaskStatus.TODO);
        int inProgress = (int) taskRepository.countByAssigneeIdAndStatus(userId, TaskStatus.IN_PROGRESS);
        int done = (int) taskRepository.countByAssigneeIdAndStatus(userId, TaskStatus.DONE);

        int overdue = (int) taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(
                userId, LocalDate.now(), TaskStatus.DONE);

        int assigned = todo + inProgress + done;

        int activeProjects = countActiveProjects(user);

        int completedLast7Days = (int) taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(
                userId, TaskStatus.DONE, LocalDateTime.now().minusDays(7));

        List<DashboardResponse.DashboardTask> overdueTaskList = taskRepository
                .findOverdueByAssignee(userId, LocalDate.now(), TaskStatus.DONE)
                .stream().map(this::toDashboardTask).toList();

        List<DashboardResponse.DashboardTask> recentTaskList = taskRepository
                .findRecentByAssignee(userId, PageRequest.of(0, 5))
                .stream().map(this::toDashboardTask).toList();

        return new DashboardResponse(
                new DashboardResponse.TasksByStatus(todo, inProgress, done),
                overdue,
                assigned,
                activeProjects,
                completedLast7Days,
                overdueTaskList,
                recentTaskList
        );
    }

    private DashboardResponse.DashboardTask toDashboardTask(Task task) {
        return new DashboardResponse.DashboardTask(
                task.getId(),
                task.getTitle(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getProject().getId(),
                task.getProject().getName(),
                task.getCreatedAt()
        );
    }

    private int countActiveProjects(User user) {
        return (int) projectRepository.countByUserMembership(user.getId());
    }
}
