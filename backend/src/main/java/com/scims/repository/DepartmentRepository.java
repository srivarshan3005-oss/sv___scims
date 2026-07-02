package com.scims.repository;

import com.scims.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByIsActiveTrue();

    Optional<Department> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.department.id = :departmentId")
    long countCategoriesByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.department.id = :departmentId AND u.role.name = 'ROLE_SUB_ADMIN'")
    long countSubAdminsByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :departmentId")
    long countComplaintsByDepartmentId(@Param("departmentId") Long departmentId);
}
