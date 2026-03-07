package com.trackr.dto;

import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TaskRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private Long assigneeId;

    @FutureOrPresent(message = "Due date must be today or in the future")
    private LocalDate dueDate;
}
