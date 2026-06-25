package com.scims.repository;

import com.scims.entity.Complaint;
import com.scims.entity.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Page<Complaint> findByUserId(Long userId, Pageable pageable);

    List<Complaint> findByUserId(Long userId);

    /**
     * Wrapped the OR search clause in parentheses so AND/OR precedence
     * works correctly. Without parens, (:search IS NULL OR ...) was evaluated
     * as: (status AND categoryId AND title) OR location — wrong logic.
     */
    @Query("SELECT c FROM Complaint c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:categoryId IS NULL OR c.category.id = :categoryId) AND " +
           "(:search IS NULL OR (LOWER(c.title) LIKE LOWER(CONCAT('%',:search,'%')) " +
           " OR LOWER(c.location) LIKE LOWER(CONCAT('%',:search,'%'))))")
    Page<Complaint> findAllWithFilters(
            @Param("status") ComplaintStatus status,
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            Pageable pageable);

    long countByStatus(ComplaintStatus status);

    long countByUserId(Long userId);

    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.user.id = :userId AND c.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId,
                                 @Param("status") ComplaintStatus status);
}
