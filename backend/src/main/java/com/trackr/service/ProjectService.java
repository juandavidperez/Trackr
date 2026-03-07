package com.trackr.service;

import com.trackr.dto.AddMemberRequest;
import com.trackr.dto.ProjectRequest;
import com.trackr.dto.ProjectResponse;
import com.trackr.exception.AccessDeniedException;
import com.trackr.exception.ResourceNotFoundException;
import com.trackr.model.Project;
import com.trackr.model.User;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
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

    public List<ProjectResponse> listByUser(User user) {
        List<Project> owned = projectRepository.findByOwnerId(user.getId());
        List<Project> member = projectRepository.findByMembersId(user.getId());
        return Stream.concat(owned.stream(), member.stream())
                .distinct()
                .map(this::toResponse)
                .collect(Collectors.toList());
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
