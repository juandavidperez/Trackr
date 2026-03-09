package com.trackr.service;

import com.trackr.dto.DashboardResponse;
import com.trackr.model.User;
import com.trackr.model.enums.TaskStatus;
import com.trackr.model.enums.UserRole;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user.setRole(UserRole.MEMBER);
    }

    @Test
    void getStats_returnsCorrectTasksByStatus() {
        when(taskRepository.countByAssigneeIdAndStatus(1L, TaskStatus.TODO)).thenReturn(3L);
        when(taskRepository.countByAssigneeIdAndStatus(1L, TaskStatus.IN_PROGRESS)).thenReturn(2L);
        when(taskRepository.countByAssigneeIdAndStatus(1L, TaskStatus.DONE)).thenReturn(5L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(1L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(2L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getTasksByStatus().getTodo()).isEqualTo(3);
        assertThat(response.getTasksByStatus().getInProgress()).isEqualTo(2);
        assertThat(response.getTasksByStatus().getDone()).isEqualTo(5);
        assertThat(response.getAssignedTasks()).isEqualTo(10);
    }

    @Test
    void getStats_returnsOverdueTasks() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(4L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getOverdueTasks()).isEqualTo(4);
    }

    @Test
    void getStats_returnsCompletedLast7Days() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(7L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getCompletedLast7Days()).isEqualTo(7);
    }

    @Test
    void getStats_countsDistinctActiveProjects() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(2L);

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getActiveProjects()).isEqualTo(2);
    }

    @Test
    void getStats_noData_returnsZeros() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getAssignedTasks()).isZero();
        assertThat(response.getOverdueTasks()).isZero();
        assertThat(response.getActiveProjects()).isZero();
        assertThat(response.getCompletedLast7Days()).isZero();
    }
}
