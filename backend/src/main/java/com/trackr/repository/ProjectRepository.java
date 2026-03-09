package com.trackr.repository;

import com.trackr.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.members m WHERE p.owner.id = :userId OR m.id = :userId")
    Page<Project> findByUserMembership(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p LEFT JOIN p.members m WHERE p.owner.id = :userId OR m.id = :userId")
    long countByUserMembership(@Param("userId") Long userId);
}
