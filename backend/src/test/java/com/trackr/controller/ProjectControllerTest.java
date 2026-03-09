package com.trackr.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackr.dto.AddMemberRequest;
import com.trackr.dto.ProjectRequest;
import com.trackr.dto.ProjectResponse;
import com.trackr.dto.ProjectStatsResponse;
import com.trackr.dto.UserResponse;
import com.trackr.model.enums.UserRole;
import com.trackr.repository.UserRepository;
import com.trackr.security.JwtAuthenticationEntryPoint;
import com.trackr.security.JwtTokenProvider;
import com.trackr.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private UserRepository userRepository;

    private ProjectResponse sampleResponse() {
        return new ProjectResponse(1L, "Test Project", "Description",
                "John Doe", "john@example.com", 3,
                LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    // --- create endpoint ---

    @Test
    void create_validRequest_returns201() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("New Project");
        request.setDescription("A new project");

        when(projectService.create(any(ProjectRequest.class), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Project"));
    }

    @Test
    void create_blankName_returns400() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("");

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_nameTooLong_returns400() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("A".repeat(256));

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_descriptionTooLong_returns400() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("Valid Name");
        request.setDescription("A".repeat(1001));

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- list endpoint ---

    @Test
    void list_returnsPagedProjectList() throws Exception {
        when(projectService.listByUser(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Test Project"))
                .andExpect(jsonPath("$.content[0].ownerName").value("John Doe"));
    }

    @Test
    void list_empty_returnsEmptyPage() throws Exception {
        when(projectService.listByUser(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    // --- getById endpoint ---

    @Test
    void getById_returnsProject() throws Exception {
        when(projectService.getById(eq(1L), any())).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Project"))
                .andExpect(jsonPath("$.memberCount").value(3));
    }

    // --- update endpoint ---

    @Test
    void update_validRequest_returns200() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("Updated Project");
        request.setDescription("Updated desc");

        when(projectService.update(eq(1L), any(ProjectRequest.class), any())).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/projects/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void update_blankName_returns400() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("");

        mockMvc.perform(put("/api/projects/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- delete endpoint ---

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/projects/1"))
                .andExpect(status().isNoContent());

        verify(projectService).delete(eq(1L), any());
    }

    // --- getMembers endpoint ---

    @Test
    void getMembers_returnsMemberList() throws Exception {
        List<UserResponse> members = List.of(
                new UserResponse(1L, "John Doe", "john@example.com", UserRole.ADMIN),
                new UserResponse(2L, "Jane Doe", "jane@example.com", UserRole.MEMBER)
        );

        when(projectService.getMembers(eq(1L), any())).thenReturn(members);

        mockMvc.perform(get("/api/projects/1/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("John Doe"))
                .andExpect(jsonPath("$[1].name").value("Jane Doe"))
                .andExpect(jsonPath("$.length()").value(2));
    }

    // --- addMember endpoint ---

    @Test
    void addMember_validRequest_returns200() throws Exception {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("jane@example.com");

        when(projectService.addMember(eq(1L), any(AddMemberRequest.class), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/projects/1/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void addMember_blankEmail_returns400() throws Exception {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("");

        mockMvc.perform(post("/api/projects/1/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addMember_invalidEmail_returns400() throws Exception {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(post("/api/projects/1/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- removeMember endpoint ---

    @Test
    void removeMember_returns200() throws Exception {
        when(projectService.removeMember(eq(1L), eq(2L), any())).thenReturn(sampleResponse());

        mockMvc.perform(delete("/api/projects/1/members/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(projectService).removeMember(eq(1L), eq(2L), any());
    }

    // --- getStats endpoint ---

    @Test
    void getStats_returnsProjectStats() throws Exception {
        ProjectStatsResponse stats = new ProjectStatsResponse(
                new ProjectStatsResponse.TasksByStatus(3, 2, 5),
                new ProjectStatsResponse.TasksByPriority(4, 3, 3),
                10, 1, 50.0
        );
        when(projectService.getStats(eq(1L), any())).thenReturn(stats);

        mockMvc.perform(get("/api/projects/1/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasksByStatus.todo").value(3))
                .andExpect(jsonPath("$.tasksByStatus.inProgress").value(2))
                .andExpect(jsonPath("$.tasksByStatus.done").value(5))
                .andExpect(jsonPath("$.tasksByPriority.low").value(4))
                .andExpect(jsonPath("$.tasksByPriority.medium").value(3))
                .andExpect(jsonPath("$.tasksByPriority.high").value(3))
                .andExpect(jsonPath("$.totalTasks").value(10))
                .andExpect(jsonPath("$.overdue").value(1))
                .andExpect(jsonPath("$.completionPercentage").value(50.0));
    }
}
