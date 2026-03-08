package com.trackr.service;

import com.trackr.dto.AddMemberRequest;
import com.trackr.dto.ProjectRequest;
import com.trackr.dto.ProjectResponse;
import com.trackr.dto.UserResponse;
import com.trackr.exception.AccessDeniedException;
import com.trackr.exception.ResourceNotFoundException;
import com.trackr.model.Project;
import com.trackr.model.User;
import com.trackr.model.enums.UserRole;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    private User owner;
    private User member;
    private Project testProject;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setName("John Doe");
        owner.setEmail("john@example.com");
        owner.setRole(UserRole.ADMIN);

        member = new User();
        member.setId(2L);
        member.setName("Jane Doe");
        member.setEmail("jane@example.com");
        member.setRole(UserRole.MEMBER);

        testProject = new Project();
        testProject.setId(10L);
        testProject.setName("Test Project");
        testProject.setDescription("A test project");
        testProject.setOwner(owner);
        testProject.setCreatedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        testProject.setMembers(new HashSet<>(Set.of(owner)));
    }

    // --- create ---

    @Test
    void create_success_savesProjectAndReturnsResponse() {
        ProjectRequest request = new ProjectRequest();
        request.setName("New Project");
        request.setDescription("New desc");

        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });

        ProjectResponse response = projectService.create(request, owner);

        assertThat(response.getName()).isEqualTo("New Project");
        assertThat(response.getDescription()).isEqualTo("New desc");
        assertThat(response.getOwnerName()).isEqualTo("John Doe");
        assertThat(response.getMemberCount()).isEqualTo(1);
        verify(projectRepository).save(any(Project.class));
    }

    // --- listByUser ---

    @Test
    void listByUser_returnsCombinedDistinctProjects() {
        when(projectRepository.findByOwnerId(1L)).thenReturn(List.of(testProject));
        when(projectRepository.findByMembersId(1L)).thenReturn(List.of(testProject));

        List<ProjectResponse> result = projectService.listByUser(owner);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Project");
    }

    // --- getById ---

    @Test
    void getById_asMember_returnsProject() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        ProjectResponse response = projectService.getById(10L, owner);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("Test Project");
    }

    @Test
    void getById_notFound_throwsResourceNotFoundException() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getById(99L, owner))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    void getById_notMember_throwsAccessDeniedException() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.getById(10L, member))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You are not a member of this project");
    }

    // --- update ---

    @Test
    void update_asOwner_updatesAndReturnsProject() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Updated Name");
        request.setDescription("Updated desc");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.update(10L, request, owner);

        assertThat(response.getName()).isEqualTo("Updated Name");
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void update_notOwner_throwsAccessDeniedException() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Updated");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.update(10L, request, member))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only the project owner can perform this action");
    }

    // --- delete ---

    @Test
    void delete_asOwner_deletesProject() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        projectService.delete(10L, owner);

        verify(projectRepository).delete(testProject);
    }

    @Test
    void delete_notOwner_throwsAccessDeniedException() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.delete(10L, member))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- getMembers ---

    @Test
    void getMembers_asMember_returnsUserResponseList() {
        testProject.getMembers().add(member);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        List<UserResponse> result = projectService.getMembers(10L, owner);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(UserResponse::email)
                .containsExactlyInAnyOrder("john@example.com", "jane@example.com");
    }

    @Test
    void getMembers_notMember_throwsAccessDeniedException() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.getMembers(10L, member))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- addMember ---

    @Test
    void addMember_asOwner_addsUserAndReturnsResponse() {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("jane@example.com");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(member));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.addMember(10L, request, owner);

        assertThat(response).isNotNull();
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void addMember_userNotFound_throwsResourceNotFoundException() {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("unknown@example.com");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.addMember(10L, request, owner))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void addMember_alreadyMember_throwsIllegalArgumentException() {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("john@example.com");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> projectService.addMember(10L, request, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User is already a member of this project");
    }

    @Test
    void addMember_notOwner_throwsAccessDeniedException() {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("jane@example.com");

        testProject.getMembers().add(member);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.addMember(10L, request, member))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- removeMember ---

    @Test
    void removeMember_asOwner_removesMember() {
        testProject.getMembers().add(member);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.removeMember(10L, 2L, owner);

        assertThat(response).isNotNull();
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void removeMember_ownerCannotRemoveSelf_throwsIllegalArgumentException() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.removeMember(10L, 1L, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot remove the project owner from members");
    }

    @Test
    void removeMember_userNotMember_throwsIllegalArgumentException() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> projectService.removeMember(10L, 2L, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User is not a member of this project");
    }

    @Test
    void removeMember_notOwner_throwsAccessDeniedException() {
        testProject.getMembers().add(member);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));

        assertThatThrownBy(() -> projectService.removeMember(10L, 2L, member))
                .isInstanceOf(AccessDeniedException.class);
    }
}
