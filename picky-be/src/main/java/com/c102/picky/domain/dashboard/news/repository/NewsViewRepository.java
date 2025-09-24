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
}