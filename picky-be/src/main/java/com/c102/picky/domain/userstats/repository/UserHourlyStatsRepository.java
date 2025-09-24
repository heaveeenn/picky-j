package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.userstats.entity.UserHourlyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface UserHourlyStatsRepository extends JpaRepository<UserHourlyStats, Long> {
    Optional<UserHourlyStats> findByUserAndHour(User user, Integer hour);

    List<UserHourlyStats> findByUserId(Long userId);

    /**
     * 주어진 기간 동안 모든 사용자 통틀어서
     * 가장 브라우징 시간이 많은 시간대(hour)를 반환
     */
    @Query("SELECT h.hour " +
            "FROM UserHourlyStats h " +
            "WHERE h.hour IS NOT NULL " +
            "GROUP BY h.hour " +
            "ORDER BY SUM(h.timeSpent) DESC")
    List<Integer> findPeakHours();

    default Integer findPeakHour() {
        List<Integer> result = findPeakHours();
        return result.isEmpty() ? null : result.get(0);
    }
}
