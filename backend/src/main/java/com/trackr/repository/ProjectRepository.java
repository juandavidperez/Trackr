package com.trackr.repository;

import com.trackr.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwnerId(Long ownerId);

    List<Project> findByMembersId(Long userId);

    @Query("SELECT COUNT(DISTINCT p) FROM Project p LEFT JOIN p.members m WHERE p.owner.id = :userId OR m.id = :userId")
    long countByUserMembership(@Param("userId") Long userId);
}
