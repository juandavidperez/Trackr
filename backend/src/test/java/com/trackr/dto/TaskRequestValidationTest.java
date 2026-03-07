package com.trackr.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TaskRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private TaskRequest validRequest() {
        TaskRequest request = new TaskRequest();
        request.setTitle("Valid title");
        return request;
    }

    @Test
    void valid_noViolations() {
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(validRequest());
        assertThat(violations).isEmpty();
    }

    @Test
    void blankTitle_violates() {
        TaskRequest request = validRequest();
        request.setTitle("");
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Test
    void nullTitle_violates() {
        TaskRequest request = validRequest();
        request.setTitle(null);
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Test
    void titleExactly255_noViolation() {
        TaskRequest request = validRequest();
        request.setTitle("A".repeat(255));
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    void titleOver255_violates() {
        TaskRequest request = validRequest();
        request.setTitle("A".repeat(256));
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title")
                && v.getMessage().contains("255"));
    }

    @Test
    void descriptionExactly1000_noViolation() {
        TaskRequest request = validRequest();
        request.setDescription("A".repeat(1000));
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    void descriptionOver1000_violates() {
        TaskRequest request = validRequest();
        request.setDescription("A".repeat(1001));
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("description")
                && v.getMessage().contains("1000"));
    }

    @Test
    void dueDateToday_noViolation() {
        TaskRequest request = validRequest();
        request.setDueDate(LocalDate.now());
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    void dueDateFuture_noViolation() {
        TaskRequest request = validRequest();
        request.setDueDate(LocalDate.now().plusDays(30));
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    void dueDatePast_violates() {
        TaskRequest request = validRequest();
        request.setDueDate(LocalDate.of(2020, 1, 1));
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("dueDate"));
    }

    @Test
    void dueDateNull_noViolation() {
        TaskRequest request = validRequest();
        request.setDueDate(null);
        Set<ConstraintViolation<TaskRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }
}
