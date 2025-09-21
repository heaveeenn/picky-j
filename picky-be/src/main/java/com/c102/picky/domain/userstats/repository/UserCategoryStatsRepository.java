package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserCategoryStatsRepository extends JpaRepository<UserCategoryStats, Long> {
    Optional<UserCategoryStats> findByUserAndCategory(User user, Category category);
}
