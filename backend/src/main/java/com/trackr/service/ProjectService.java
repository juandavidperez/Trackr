package com.trackr.service;

import com.trackr.dto.AddMemberRequest;
import com.trackr.dto.ProjectRequest;
import com.trackr.dto.ProjectResponse;
import com.trackr.dto.ProjectStatsResponse;
import com.trackr.dto.UserResponse;
import com.trackr.exception.AccessDeniedException;
import com.trackr.exception.ResourceNotFoundException;
import com.trackr.model.Project;
import com.trackr.model.User;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import com.trackr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse create(ProjectRequest request, User owner) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setOwner(owner);
        project.getMembers().add(owner);
        project = projectRepository.save(project);
        return toResponse(project);
    }

    public Page<ProjectResponse> listByUser(User user, Pageable pageable) {
        return projectRepository.findByUserMembership(user.getId(), pageable)
                .map(this::toResponse);
    }

    public ProjectResponse getById(Long id, User user) {
        Project project = findProjectOrThrow(id);
        requireMember(project, user);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request, User user) {
        Project project = findProjectOrThrow(id);
        requireOwner(project, user);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project = projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public void delete(Long id, User user) {
        Project project = findProjectOrThrow(id);
        requireOwner(project, user);
        projectRepository.delete(project);
    }

    public List<UserResponse> getMembers(Long projectId, User user) {
        Project project = findProjectOrThrow(projectId);
        requireMember(project, user);
        return project.getMembers().stream()
                .map(m -> new UserResponse(m.getId(), m.getName(), m.getEmail(), m.getRole()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse addMember(Long projectId, AddMemberRequest request, User user) {
        Project project = findProjectOrThrow(projectId);
        requireOwner(project, user);
        User newMember = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));
        if (project.getMembers().contains(newMember)) {
            throw new IllegalArgumentException("User is already a member of this project");
        }
        project.getMembers().add(newMember);
        project = projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse removeMember(Long projectId, Long userId, User user) {
        Project project = findProjectOrThrow(projectId);
        requireOwner(project, user);
        if (project.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot remove the project owner from members");
        }
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!project.getMembers().contains(member)) {
            throw new IllegalArgumentException("User is not a member of this project");
        }
        project.getMembers().remove(member);
        project = projectRepository.save(project);
        return toResponse(project);
    }

    public ProjectStatsResponse getStats(Long projectId, User user) {
        Project project = findProjectOrThrow(projectId);
        requireMember(project, user);

        int todo = (int) taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.TODO);
        int inProgress = (int) taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.IN_PROGRESS);
        int done = (int) taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE);

        int low = (int) taskRepository.countByProjectIdAndPriority(projectId, TaskPriority.LOW);
        int medium = (int) taskRepository.countByProjectIdAndPriority(projectId, TaskPriority.MEDIUM);
        int high = (int) taskRepository.countByProjectIdAndPriority(projectId, TaskPriority.HIGH);

        int totalTasks = todo + inProgress + done;
        int overdue = (int) taskRepository.countByProjectIdAndDueDateBeforeAndStatusNot(
                projectId, LocalDate.now(), TaskStatus.DONE);
        double completionPercentage = totalTasks > 0 ? (done * 100.0) / totalTasks : 0.0;

        return new ProjectStatsResponse(
                new ProjectStatsResponse.TasksByStatus(todo, inProgress, done),
                new ProjectStatsResponse.TasksByPriority(low, medium, high),
                totalTasks,
                overdue,
                completionPercentage
        );
    }

    private Project findProjectOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private void requireOwner(Project project, User user) {
        if (!project.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the project owner can perform this action");
        }
    }

    private void requireMember(Project project, User user) {
        boolean isMember = project.getMembers().stream()
                .anyMatch(m -> m.getId().equals(user.getId()));
        if (!isMember) {
            throw new AccessDeniedException("You are not a member of this project");
        }
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getOwner().getName(),
                project.getOwner().getEmail(),
                project.getMembers().size(),
                project.getCreatedAt()
        );
    }
}
