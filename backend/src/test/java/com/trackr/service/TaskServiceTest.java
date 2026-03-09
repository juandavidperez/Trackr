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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    private Pageable defaultPageable;

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

        defaultPageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
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
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(Page.empty());

        taskService.listByProject(10L, null, null, null, null, defaultPageable, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void listByProject_withStatusFilter_forwardsStatus() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), eq(TaskStatus.TODO), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(Page.empty());

        taskService.listByProject(10L, TaskStatus.TODO, null, null, null, defaultPageable, member);

        verify(taskRepository).findByFilters(eq(10L), eq(TaskStatus.TODO), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void listByProject_withPriorityFilter_forwardsPriority() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), eq(TaskPriority.HIGH), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(Page.empty());

        taskService.listByProject(10L, null, TaskPriority.HIGH, null, null, defaultPageable, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), eq(TaskPriority.HIGH), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void listByProject_withAssigneeFilter_forwardsAssigneeId() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), eq(1L), isNull(), any(Pageable.class)))
                .thenReturn(Page.empty());

        taskService.listByProject(10L, null, null, 1L, null, defaultPageable, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), eq(1L), isNull(), any(Pageable.class));
    }

    @Test
    void listByProject_withSearchFilter_forwardsSearch() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), eq("navbar"), any(Pageable.class)))
                .thenReturn(Page.empty());

        taskService.listByProject(10L, null, null, null, "navbar", defaultPageable, member);

        verify(taskRepository).findByFilters(eq(10L), isNull(), isNull(), isNull(), eq("navbar"), any(Pageable.class));
    }

    @Test
    void listByProject_withAllFilters_forwardsAll() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), eq(TaskStatus.IN_PROGRESS), eq(TaskPriority.HIGH), eq(1L), eq("test"), any(Pageable.class)))
                .thenReturn(Page.empty());

        taskService.listByProject(10L, TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 1L, "test", defaultPageable, member);

        verify(taskRepository).findByFilters(eq(10L), eq(TaskStatus.IN_PROGRESS), eq(TaskPriority.HIGH), eq(1L), eq("test"), any(Pageable.class));
    }

    // --- listByProject: response mapping ---

    @Test
    void listByProject_mapsTasksToResponses() {
        Task task = buildTask(1L, "Test Task", TaskStatus.TODO, TaskPriority.HIGH, member);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(task)));

        Page<TaskResponse> responses = taskService.listByProject(10L, null, null, null, null, defaultPageable, member);

        assertThat(responses.getContent()).hasSize(1);
        TaskResponse response = responses.getContent().get(0);
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
        when(taskRepository.findByFilters(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(task)));

        Page<TaskResponse> responses = taskService.listByProject(10L, null, null, null, null, defaultPageable, member);

        assertThat(responses.getContent().get(0).getAssigneeName()).isNull();
    }

    // --- listByProject: authorization ---

    @Test
    void listByProject_nonMember_throwsAccessDenied() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> taskService.listByProject(10L, null, null, null, null, defaultPageable, nonMember))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not a member of this project");
    }

    @Test
    void listByProject_projectNotFound_throwsResourceNotFound() {
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.listByProject(999L, null, null, null, null, defaultPageable, member))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }
}
