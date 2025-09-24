package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.userstats.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, Long> {
    Optional<UserStats> findByUser(User user);

    Optional<UserStats> findByUserId(Long userId);

    @Query("SELECT AVG(u.totalSites) FROM UserStats u")
    Double calculateAvgVisitCount();

    @Query("SELECT AVG(u.totalTimeSpent) FROM UserStats u")
    Double calculateAvgBrowsingSeconds();
}
