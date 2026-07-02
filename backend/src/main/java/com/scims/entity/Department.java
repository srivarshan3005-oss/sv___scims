package com.scims.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Categories routed to this department. One department can own many categories.
    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<Category> categories;

    // Sub Admins assigned to this department. Unlimited sub admins per department.
    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<User> subAdmins;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }
}
