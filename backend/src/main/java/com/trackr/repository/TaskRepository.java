package com.trackr.repository;

import com.trackr.model.Task;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssigneeId(Long assigneeId);

    List<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignee WHERE t.project.id = :projectId "
         + "AND (:status IS NULL OR t.status = :status) "
         + "AND (:priority IS NULL OR t.priority = :priority) "
         + "AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId) "
         + "AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) "
         + "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Task> findByFilters(@Param("projectId") Long projectId,
                             @Param("status") TaskStatus status,
                             @Param("priority") TaskPriority priority,
                             @Param("assigneeId") Long assigneeId,
                             @Param("search") String search,
                             Sort sort);
}
