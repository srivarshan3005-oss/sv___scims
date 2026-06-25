package com.scims.repository;

import com.scims.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByIsActiveTrue();

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    /**
     * Added a dedicated count query so CategoryServiceImpl never
     * needs to call getComplaints() on the lazy collection outside a
     * transaction (which throws LazyInitializationException).
     */
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.category.id = :categoryId")
    long countComplaintsByCategoryId(@Param("categoryId") Long categoryId);
}
