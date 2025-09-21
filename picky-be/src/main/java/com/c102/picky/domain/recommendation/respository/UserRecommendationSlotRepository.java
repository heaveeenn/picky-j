package com.c102.picky.domain.recommendation.respository;

import com.c102.picky.domain.recommendation.entity.UserRecommendationSlot;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.model.SlotStatus;
import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRecommendationSlotRepository extends JpaRepository<UserRecommendationSlot, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s FROM UserRecommendationSlot s
        WHERE s.userId = :userId
            AND s.contentType = :contentType
            AND s.slotAt BETWEEN :start AND :end
            AND s.status = :status
        ORDER BY s.priority ASC, s.id ASC
        """)
    List<UserRecommendationSlot> findTopForDeliveryWithLock(
            @Param("userId") Long userId,
            @Param("contentType")ContentType contentType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("status") SlotStatus status,
            Pageable pageable
            );

    Optional<UserRecommendationSlot> findByIdAndUserId(Long id, Long userId);

    Optional<UserRecommendationSlot> findTopByUserIdAndContentTypeOrderBySlotAtDesc(Long userId, ContentType contentType);

    List<UserRecommendationSlot> findByUserIdAndStatusAndContentTypeOrderBySlotAtAsc(Long userId, SlotStatus status, ContentType contentType);
}
