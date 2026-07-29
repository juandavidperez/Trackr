package com.trackr.dto;

import com.trackr.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskPositionRequest {

    @NotNull(message = "Position is required")
    private Integer position;

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
