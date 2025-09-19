package com.c102.picky.domain.userinterest.entity;

import com.c102.picky.domain.category.entity.Category;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
@Entity
@Table(name = "user_interest_categories")
public class UserInterestCategory {

    @EmbeddedId
    private UserCategoryId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("categoryId")
    @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "fk_uic_category"))
    private Category category;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // 정적 팩토리
    public static UserInterestCategory of(Long userId, Category category) {
        return UserInterestCategory.builder()
                .id(new UserCategoryId(userId, category.getId()))
                .category(category)
                .build();
    }
}
