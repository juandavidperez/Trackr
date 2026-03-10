package com.trackr.service;

import com.trackr.dto.DashboardResponse;
import com.trackr.model.Project;
import com.trackr.model.Task;
import com.trackr.model.User;
import com.trackr.model.enums.TaskPriority;
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
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

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

    private void stubListQueries() {
        when(taskRepository.findOverdueByAssignee(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE)))
                .thenReturn(Collections.emptyList());
        when(taskRepository.findRecentByAssignee(eq(1L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());
    }

    @Test
    void getStats_returnsCorrectTasksByStatus() {
        when(taskRepository.countByAssigneeIdAndStatus(1L, TaskStatus.TODO)).thenReturn(3L);
        when(taskRepository.countByAssigneeIdAndStatus(1L, TaskStatus.IN_PROGRESS)).thenReturn(2L);
        when(taskRepository.countByAssigneeIdAndStatus(1L, TaskStatus.DONE)).thenReturn(5L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(1L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(2L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);
        stubListQueries();

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
        stubListQueries();

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getOverdueTasks()).isEqualTo(4);
    }

    @Test
    void getStats_returnsCompletedLast7Days() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(7L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);
        stubListQueries();

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getCompletedLast7Days()).isEqualTo(7);
    }

    @Test
    void getStats_countsDistinctActiveProjects() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(2L);
        stubListQueries();

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getActiveProjects()).isEqualTo(2);
    }

    @Test
    void getStats_noData_returnsZeros() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);
        stubListQueries();

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getAssignedTasks()).isZero();
        assertThat(response.getOverdueTasks()).isZero();
        assertThat(response.getActiveProjects()).isZero();
        assertThat(response.getCompletedLast7Days()).isZero();
        assertThat(response.getOverdueTaskList()).isEmpty();
        assertThat(response.getRecentTaskList()).isEmpty();
    }

    @Test
    void getStats_returnsOverdueTaskList() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(1L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);

        Project project = new Project();
        project.setId(10L);
        project.setName("Test Project");

        Task overdueTask = new Task();
        overdueTask.setId(1L);
        overdueTask.setTitle("Overdue task");
        overdueTask.setStatus(TaskStatus.TODO);
        overdueTask.setPriority(TaskPriority.HIGH);
        overdueTask.setDueDate(LocalDate.now().minusDays(3));
        overdueTask.setProject(project);
        overdueTask.setCreatedAt(LocalDateTime.now());

        when(taskRepository.findOverdueByAssignee(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE)))
                .thenReturn(List.of(overdueTask));
        when(taskRepository.findRecentByAssignee(eq(1L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getOverdueTaskList()).hasSize(1);
        assertThat(response.getOverdueTaskList().get(0).getTitle()).isEqualTo("Overdue task");
        assertThat(response.getOverdueTaskList().get(0).getProjectName()).isEqualTo("Test Project");
    }

    @Test
    void getStats_returnsRecentTaskList() {
        when(taskRepository.countByAssigneeIdAndStatus(eq(1L), any())).thenReturn(1L);
        when(taskRepository.countByAssigneeIdAndDueDateBeforeAndStatusNot(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE))).thenReturn(0L);
        when(taskRepository.countByAssigneeIdAndStatusAndUpdatedAtAfter(eq(1L), eq(TaskStatus.DONE), any(LocalDateTime.class))).thenReturn(0L);
        when(projectRepository.countByUserMembership(1L)).thenReturn(0L);

        Project project = new Project();
        project.setId(10L);
        project.setName("My Project");

        Task recentTask = new Task();
        recentTask.setId(2L);
        recentTask.setTitle("New task");
        recentTask.setStatus(TaskStatus.TODO);
        recentTask.setPriority(TaskPriority.MEDIUM);
        recentTask.setProject(project);
        recentTask.setCreatedAt(LocalDateTime.now());

        when(taskRepository.findOverdueByAssignee(eq(1L), any(LocalDate.class), eq(TaskStatus.DONE)))
                .thenReturn(Collections.emptyList());
        when(taskRepository.findRecentByAssignee(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(recentTask));

        DashboardResponse response = dashboardService.getStats(user);

        assertThat(response.getRecentTaskList()).hasSize(1);
        assertThat(response.getRecentTaskList().get(0).getTitle()).isEqualTo("New task");
        assertThat(response.getRecentTaskList().get(0).getProjectName()).isEqualTo("My Project");
    }
}
