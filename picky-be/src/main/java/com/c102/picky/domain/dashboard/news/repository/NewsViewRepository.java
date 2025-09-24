package com.c102.picky.domain.dashboard.news.repository;

import java.time.LocalDateTime;
import com.c102.picky.domain.dashboard.news.entity.NewsView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsViewRepository extends JpaRepository<NewsView, Long> {

    @Query("SELECT COUNT(nv) FROM NewsView nv WHERE nv.userId = :userId AND nv.viewedAt >= :startDate AND nv.viewedAt < :endDate")
    long countByUserIdAndViewedAtBetween(@Param("userId") Long userId,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(nv) FROM NewsView nv WHERE nv.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndNewsId(Long userId, Long newsId);

    // 일별 뉴스 소비량 조회 (현재 주 월요일부터)
    @Query("""
        SELECT DAYOFWEEK(nv.viewedAt) as dayOfWeek, COUNT(nv) as count
        FROM NewsView nv
        WHERE nv.userId = :userId
        AND nv.viewedAt >= :weekStart
        AND nv.viewedAt < :weekEnd
        GROUP BY DAYOFWEEK(nv.viewedAt)
        ORDER BY DAYOFWEEK(nv.viewedAt)
        """)
    Object[][] findDailyConsumptionByWeek(@Param("userId") Long userId,
                                        @Param("weekStart") LocalDateTime weekStart,
                                        @Param("weekEnd") LocalDateTime weekEnd);
}