package com.trackr.controller;

import com.trackr.dto.DashboardResponse;
import com.trackr.repository.UserRepository;
import com.trackr.security.JwtAuthenticationEntryPoint;
import com.trackr.security.JwtTokenProvider;
import com.trackr.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private UserRepository userRepository;

    private DashboardResponse sampleResponse() {
        return new DashboardResponse(
                new DashboardResponse.TasksByStatus(3, 2, 5),
                1, 10, 2, 4
        );
    }

    @Test
    void getStats_returnsOkWithDashboardData() throws Exception {
        when(dashboardService.getStats(any())).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasksByStatus.todo").value(3))
                .andExpect(jsonPath("$.tasksByStatus.inProgress").value(2))
                .andExpect(jsonPath("$.tasksByStatus.done").value(5))
                .andExpect(jsonPath("$.overdueTasks").value(1))
                .andExpect(jsonPath("$.assignedTasks").value(10))
                .andExpect(jsonPath("$.activeProjects").value(2))
                .andExpect(jsonPath("$.completedLast7Days").value(4));
    }

    @Test
    void getStats_noData_returnsZeros() throws Exception {
        DashboardResponse emptyResponse = new DashboardResponse(
                new DashboardResponse.TasksByStatus(0, 0, 0),
                0, 0, 0, 0
        );
        when(dashboardService.getStats(any())).thenReturn(emptyResponse);

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTasks").value(0))
                .andExpect(jsonPath("$.overdueTasks").value(0))
                .andExpect(jsonPath("$.activeProjects").value(0))
                .andExpect(jsonPath("$.completedLast7Days").value(0));
    }
}
