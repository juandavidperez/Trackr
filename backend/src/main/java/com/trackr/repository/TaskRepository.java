package com.trackr.repository;

import com.trackr.model.Task;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssigneeId(Long assigneeId);

    List<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.project.id = :projectId "
         + "AND (:status IS NULL OR t.status = :status) "
         + "AND (:priority IS NULL OR t.priority = :priority) "
         + "AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId) "
         + "AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) "
         + "OR LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Task> findByFilters(@Param("projectId") Long projectId,
                             @Param("status") TaskStatus status,
                             @Param("priority") TaskPriority priority,
                             @Param("assigneeId") Long assigneeId,
                             @Param("search") String search,
                             Pageable pageable);

    long countByAssigneeIdAndStatus(Long assigneeId, TaskStatus status);

    long countByAssigneeIdAndDueDateBeforeAndStatusNot(Long assigneeId, LocalDate date, TaskStatus status);

    long countByAssigneeIdAndStatusAndUpdatedAtAfter(Long assigneeId, TaskStatus status, LocalDateTime since);

    long countByProjectIdAndStatus(Long projectId, TaskStatus status);

    long countByProjectIdAndPriority(Long projectId, TaskPriority priority);

    long countByProjectIdAndDueDateBeforeAndStatusNot(Long projectId, LocalDate date, TaskStatus status);

    long countByProjectId(Long projectId);
}
