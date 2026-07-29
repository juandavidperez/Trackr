package com.trackr.service;

import com.trackr.dto.TaskPositionRequest;
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
import java.util.List;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import com.trackr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        
        Integer maxPos = taskRepository
                .findMaxPositionInColumn(project.getId(), task.getStatus())
                .orElse(-1000);
        task.setPosition(maxPos + 1000);

        task = taskRepository.save(task);
        return toResponse(task);
    }

    public Page<TaskResponse> listByProject(Long projectId, TaskStatus status, TaskPriority priority,
                                             Long assigneeId, String search, Pageable pageable, User user) {
        Project project = findProjectOrThrow(projectId);
        requireMember(project, user);

        Pageable sortedByPosition = PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), Sort.by("position").ascending());

        return taskRepository.findByFilters(projectId, status, priority, assigneeId, search, sortedByPosition)
                .map(this::toResponse);
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
        
        Integer maxPos = taskRepository
                .findMaxPositionInColumn(task.getProject().getId(), request.getStatus())
                .orElse(-1000);
        task.setPosition(maxPos + 1000);

        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse updatePosition(Long taskId, TaskPositionRequest request, User user) {
        Task task = findTaskOrThrow(taskId);
        requireMember(task.getProject(), user);
        task.setStatus(request.getStatus());
        task.setPosition(request.getPosition());
        task = taskRepository.save(task);
        compactIfNeeded(task.getProject().getId(), request.getStatus());
        task = taskRepository.findById(taskId).orElse(task);
        return toResponse(task);
    }

    private void compactIfNeeded(Long projectId, TaskStatus status) {
        List<Task> tasks = taskRepository.findByProjectAndStatusOrderByPosition(projectId, status);
        for (int i = 1; i < tasks.size(); i++) {
            Integer cur = tasks.get(i).getPosition();
            Integer prev = tasks.get(i - 1).getPosition();
            if (cur == null || prev == null || cur - prev < 1) {
                compactColumn(projectId, status, tasks);
                return;
            }
        }
    }

    private void compactColumn(Long projectId, TaskStatus status, List<Task> tasks) {
        int pos = 0;
        for (Task t : tasks) {
            t.setPosition(pos);
            pos += 1000;
        }
        taskRepository.saveAll(tasks);
    }

    @Transactional
    public void delete(Long taskId, User user) {
        Task task = findTaskOrThrow(taskId);
        requireMember(task.getProject(), user);
        taskRepository.delete(task);
    }

    public Page<TaskResponse> listMyTasks(Long userId, Long projectId, TaskStatus status,
                                          TaskPriority priority, String search, Pageable pageable) {
        return taskRepository.findMyTasks(userId, projectId, status, priority, search, pageable)
                .map(this::toResponse);
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
                task.getProject().getName(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getPosition()
        );
    }
}
