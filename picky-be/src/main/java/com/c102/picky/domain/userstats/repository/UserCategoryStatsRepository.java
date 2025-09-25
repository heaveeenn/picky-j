package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCategoryStatsRepository extends JpaRepository<UserCategoryStats, Long> {
    Optional<UserCategoryStats> findByUserAndCategory(User user, Category category);

    List<UserCategoryStats> findByUserIdOrderByTimeSpentDesc(Long userId);

    @Query("""
            select ucs.category.id   as categoryId,
                   ucs.category.name as categoryName,
                   sum(ucs.visitCount) as visitCount
            from UserCategoryStats ucs
            group by ucs.category.id, ucs.category.name
            """)
    List<CategoryVisitAgg> sumVisitsByCategory();

    interface CategoryVisitAgg {
        Long getCategoryId();

        String getCategoryName();

        Long getVisitCount();
    }
}
