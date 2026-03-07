package com.trackr.service;

import com.trackr.dto.TaskResponse;
import com.trackr.exception.AccessDeniedException;
import com.trackr.exception.ResourceNotFoundException;
import com.trackr.model.Project;
import com.trackr.model.Task;
import com.trackr.model.User;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import com.trackr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private User member;
    private User nonMember;
    private Project project;

    @BeforeEach
    void setUp() {
        member = new User();
        member.setId(1L);
        member.setName("Alice");
        member.setEmail("alice@test.com");

        nonMember = new User();
        nonMember.setId(99L);
        nonMember.setName("Outsider");
        nonMember.setEmail("outsider@test.com");

        project = new Project();
        project.setId(10L);
        project.setName("Test Project");
        project.setMembers(Set.of(member));
    }

    private Task buildTask(Long id, String title, TaskStatus status, TaskPriority priority, User assignee) {
        Task task = new Task();
        task.setId(id);
        task.setTitle(title);
        task.setDescription("Description for " + title);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(LocalDate.now().plusDays(7));
        task.setProject(project);
        task.setAssignee(assignee);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        return task;
    }

    // --- listByProject: filters are forwarded to repository ---

    @Test
    void listByProject_noFilters_callsRepositoryWithNulls() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Sort.class)))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, null, null, null, null, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Sort.class));
    }

    @Test
    void listByProject_withStatusFilter_forwardsStatus() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), eq(TaskStatus.TODO), isNull(), isNull(), isNull(), any(Sort.class)))
                .thenReturn(List.of());

        taskService.listByProject(10L, TaskStatus.TODO, null, null, null, null, null, member);

        verify(taskRepository).findByFilters(eq(10L), eq(TaskStatus.TODO), isNull(), isNull(), isNull(), any(Sort.class));
    }

    @Test
    void listByProject_withPriorityFilter_forwardsPriority() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), eq(TaskPriority.HIGH), isNull(), isNull(), any(Sort.class)))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, TaskPriority.HIGH, null, null, null, null, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), eq(TaskPriority.HIGH), isNull(), isNull(), any(Sort.class));
    }

    @Test
    void listByProject_withAssigneeFilter_forwardsAssigneeId() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), eq(1L), isNull(), any(Sort.class)))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, 1L, null, null, null, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), eq(1L), isNull(), any(Sort.class));
    }

    @Test
    void listByProject_withSearchFilter_forwardsSearch() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), eq("navbar"), any(Sort.class)))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, null, "navbar", null, null, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), isNull(), eq("navbar"), any(Sort.class));
    }

    @Test
    void listByProject_withAllFilters_forwardsAll() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), eq(TaskStatus.IN_PROGRESS), eq(TaskPriority.HIGH), eq(1L), eq("test"), any(Sort.class)))
                .thenReturn(List.of());

        taskService.listByProject(10L, TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 1L, "test", null, null, member);

        verify(taskRepository).findByFilters(eq(10L), eq(TaskStatus.IN_PROGRESS), eq(TaskPriority.HIGH), eq(1L), eq("test"), any(Sort.class));
    }

    // --- listByProject: sorting ---

    @Test
    void listByProject_defaultSort_usesCreatedAtDesc() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), sortCaptor.capture()))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, null, null, null, null, member);

        Sort captured = sortCaptor.getValue();
        assertThat(captured.getOrderFor("createdAt")).isNotNull();
        assertThat(captured.getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void listByProject_sortByTitle_asc() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), sortCaptor.capture()))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, null, null, "title", "asc", member);

        Sort captured = sortCaptor.getValue();
        assertThat(captured.getOrderFor("title")).isNotNull();
        assertThat(captured.getOrderFor("title").getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void listByProject_sortByDueDate_desc() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), sortCaptor.capture()))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, null, null, "dueDate", "desc", member);

        Sort captured = sortCaptor.getValue();
        assertThat(captured.getOrderFor("dueDate")).isNotNull();
        assertThat(captured.getOrderFor("dueDate").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void listByProject_invalidSortField_fallsBackToCreatedAt() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), sortCaptor.capture()))
                .thenReturn(List.of());

        taskService.listByProject(10L, null, null, null, null, "invalidField", "asc", member);

        Sort captured = sortCaptor.getValue();
        assertThat(captured.getOrderFor("createdAt")).isNotNull();
    }

    // --- listByProject: response mapping ---

    @Test
    void listByProject_mapsTasksToResponses() {
        Task task = buildTask(1L, "Test Task", TaskStatus.TODO, TaskPriority.HIGH, member);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Sort.class)))
                .thenReturn(List.of(task));

        List<TaskResponse> responses = taskService.listByProject(10L, null, null, null, null, null, null, member);

        assertThat(responses).hasSize(1);
        TaskResponse response = responses.get(0);
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Test Task");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(response.getPriority()).isEqualTo(TaskPriority.HIGH);
        assertThat(response.getAssigneeName()).isEqualTo("Alice");
        assertThat(response.getProjectId()).isEqualTo(10L);
    }

    @Test
    void listByProject_taskWithNoAssignee_returnsNullAssigneeName() {
        Task task = buildTask(2L, "Unassigned", TaskStatus.TODO, TaskPriority.LOW, null);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Sort.class)))
                .thenReturn(List.of(task));

        List<TaskResponse> responses = taskService.listByProject(10L, null, null, null, null, null, null, member);

        assertThat(responses.get(0).getAssigneeName()).isNull();
    }

    // --- listByProject: authorization ---

    @Test
    void listByProject_nonMember_throwsAccessDenied() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> taskService.listByProject(10L, null, null, null, null, null, null, nonMember))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not a member of this project");
    }

    @Test
    void listByProject_projectNotFound_throwsResourceNotFound() {
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.listByProject(999L, null, null, null, null, null, null, member))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }
}
