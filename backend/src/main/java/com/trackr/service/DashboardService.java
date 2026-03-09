package com.trackr.service;

import com.trackr.dto.DashboardResponse;
import com.trackr.model.User;
import com.trackr.model.enums.TaskStatus;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

        return new DashboardResponse(
                new DashboardResponse.TasksByStatus(todo, inProgress, done),
                overdue,
                assigned,
                activeProjects,
                completedLast7Days
        );
    }

    private int countActiveProjects(User user) {
        return (int) projectRepository.countByUserMembership(user.getId());
    }
}
