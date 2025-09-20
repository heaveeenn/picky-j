package com.c102.picky.domain.userstats.entity;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_category_stats", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_category", columnNames = {"user_id", "category_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserCategoryStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User FK
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Category FK
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    private Integer visitCount = 0;
    private Integer timeSpent = 0;
}
