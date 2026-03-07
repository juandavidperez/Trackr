package com.trackr.dto;

import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private String assigneeName;
    private Long projectId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
