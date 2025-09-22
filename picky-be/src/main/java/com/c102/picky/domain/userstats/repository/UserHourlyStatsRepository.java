package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.userstats.entity.UserHourlyStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserHourlyStatsRepository extends JpaRepository<UserHourlyStats, Long> {
    Optional<UserHourlyStats> findByUserAndHour(User user, Integer hour);

    List<UserHourlyStats> findByUserId(Long userId);
}
