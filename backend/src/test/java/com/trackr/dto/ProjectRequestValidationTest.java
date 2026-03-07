package com.trackr.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private ProjectRequest validRequest() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Valid Project");
        return request;
    }

    @Test
    void valid_noViolations() {
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(validRequest());
        assertThat(violations).isEmpty();
    }

    @Test
    void blankName_violates() {
        ProjectRequest request = validRequest();
        request.setName("");
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("name"));
    }

    @Test
    void nameExactly255_noViolation() {
        ProjectRequest request = validRequest();
        request.setName("A".repeat(255));
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    void nameOver255_violates() {
        ProjectRequest request = validRequest();
        request.setName("A".repeat(256));
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("name")
                && v.getMessage().contains("255"));
    }

    @Test
    void descriptionExactly1000_noViolation() {
        ProjectRequest request = validRequest();
        request.setDescription("A".repeat(1000));
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    void descriptionOver1000_violates() {
        ProjectRequest request = validRequest();
        request.setDescription("A".repeat(1001));
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("description")
                && v.getMessage().contains("1000"));
    }

    @Test
    void descriptionNull_noViolation() {
        ProjectRequest request = validRequest();
        request.setDescription(null);
        Set<ConstraintViolation<ProjectRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }
}
