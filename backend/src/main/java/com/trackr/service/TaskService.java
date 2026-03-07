package com.trackr.service;

import com.trackr.dto.TaskRequest;
import com.trackr.dto.TaskResponse;
import com.trackr.dto.TaskStatusRequest;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public TaskResponse create(Long projectId, TaskRequest request, User user) {
        Project project = findProjectOrThrow(projectId);
        requireMember(project, user);

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO);
        task.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        task.setDueDate(request.getDueDate());
        task.setProject(project);

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return toResponse(task);
    }

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "dueDate", "createdAt", "priority", "status", "title"
    );

    public List<TaskResponse> listByProject(Long projectId, TaskStatus status, TaskPriority priority,
                                             Long assigneeId, String search, String sortBy, String sortDir, User user) {
        Project project = findProjectOrThrow(projectId);
        requireMember(project, user);

        String sortField = sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortField);

        List<Task> tasks = taskRepository.findByFilters(projectId, status, priority, assigneeId, search, sort);

        return tasks.stream().map(this::toResponse).toList();
    }

    @Transactional
    public TaskResponse update(Long taskId, TaskRequest request, User user) {
        Task task = findTaskOrThrow(taskId);
        requireMember(task.getProject(), user);

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        task.setDueDate(request.getDueDate());

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse updateStatus(Long taskId, TaskStatusRequest request, User user) {
        Task task = findTaskOrThrow(taskId);
        requireMember(task.getProject(), user);
        task.setStatus(request.getStatus());
        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public void delete(Long taskId, User user) {
        Task task = findTaskOrThrow(taskId);
        requireMember(task.getProject(), user);
        taskRepository.delete(task);
    }

    private Project findProjectOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private Task findTaskOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private void requireMember(Project project, User user) {
        boolean isMember = project.getMembers().stream()
                .anyMatch(m -> m.getId().equals(user.getId()));
        if (!isMember) {
            throw new AccessDeniedException("You are not a member of this project");
        }
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getAssignee() != null ? task.getAssignee().getName() : null,
                task.getProject().getId(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
