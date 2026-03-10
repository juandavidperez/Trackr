package com.trackr.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackr.dto.TaskRequest;
import com.trackr.dto.TaskResponse;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import com.trackr.repository.UserRepository;
import com.trackr.security.JwtAuthenticationEntryPoint;
import com.trackr.security.JwtTokenProvider;
import com.trackr.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaskService taskService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private UserRepository userRepository;

    private TaskResponse sampleResponse() {
        return new TaskResponse(1L, "Test Task", "Description", TaskStatus.TODO,
                TaskPriority.HIGH, LocalDate.now().plusDays(5), "Alice",
                10L, "Test Project", LocalDateTime.now(), LocalDateTime.now());
    }

    // --- list endpoint: query params ---

    @Test
    void list_noParams_returnsPage() throws Exception {
        when(taskService.listByProject(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class), any()))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/projects/10/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void list_withStatusParam_forwardsToService() throws Exception {
        when(taskService.listByProject(eq(10L), eq(TaskStatus.TODO), isNull(), isNull(), isNull(), any(Pageable.class), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/projects/10/tasks").param("status", "TODO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("TODO"));
    }

    @Test
    void list_withPriorityParam_forwardsToService() throws Exception {
        when(taskService.listByProject(eq(10L), isNull(), eq(TaskPriority.HIGH), isNull(), isNull(), any(Pageable.class), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/projects/10/tasks").param("priority", "HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].priority").value("HIGH"));
    }

    @Test
    void list_withSearchParam_forwardsToService() throws Exception {
        when(taskService.listByProject(eq(10L), isNull(), isNull(), isNull(), eq("navbar"), any(Pageable.class), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/projects/10/tasks").param("search", "navbar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void list_withPaginationParams_forwardsToService() throws Exception {
        when(taskService.listByProject(eq(10L), isNull(), isNull(), isNull(), isNull(), any(Pageable.class), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/projects/10/tasks")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "createdAt,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Test Task"));
    }

    // --- create endpoint: validation ---

    @Test
    void create_blankTitle_returns400() throws Exception {
        TaskRequest request = new TaskRequest();
        request.setTitle("");

        mockMvc.perform(post("/api/projects/10/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_titleTooLong_returns400() throws Exception {
        TaskRequest request = new TaskRequest();
        request.setTitle("A".repeat(256));

        mockMvc.perform(post("/api/projects/10/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_descriptionTooLong_returns400() throws Exception {
        TaskRequest request = new TaskRequest();
        request.setTitle("Valid title");
        request.setDescription("A".repeat(1001));

        mockMvc.perform(post("/api/projects/10/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_pastDueDate_returns400() throws Exception {
        TaskRequest request = new TaskRequest();
        request.setTitle("Valid title");
        request.setDueDate(LocalDate.of(2020, 1, 1));

        mockMvc.perform(post("/api/projects/10/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        TaskRequest request = new TaskRequest();
        request.setTitle("Valid title");
        request.setDueDate(LocalDate.now().plusDays(1));

        when(taskService.create(eq(10L), any(TaskRequest.class), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/projects/10/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }
}
