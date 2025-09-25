package com.c102.picky.domain.recommendation.repository;

import com.c102.picky.domain.recommendation.dto.NewsFeedItemDto;
import com.c102.picky.domain.recommendation.entity.UserRecommendationSlot;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.model.SlotStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
            @Param("contentType") ContentType contentType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("status") SlotStatus status,
            Pageable pageable
    );

    Optional<UserRecommendationSlot> findByIdAndUserId(Long id, Long userId);

    Optional<UserRecommendationSlot> findTopByUserIdAndContentTypeOrderBySlotAtDesc(Long userId, ContentType contentType);

    @Query(value = """
            select new com.c102.picky.domain.recommendation.dto.NewsFeedItemDto(
              s.id, n.id, n.title, n.summary, n.url, c.name, n.publishedAt,
              s.priority, s.slotAt, s.reason
            )
            from UserRecommendationSlot s
              join News n on n.id = s.newsId
              join n.category c
            where s.userId = :userId
              and s.contentType = com.c102.picky.domain.recommendation.model.ContentType.NEWS
              and (:from is null or s.slotAt >= :from)
              and (:to   is null or s.slotAt <  :to)
            """,
            countQuery = """
                    select count(s)
                    from UserRecommendationSlot s
                      join News n on n.id = s.newsId
                    where s.userId = :userId
                      and s.contentType = com.c102.picky.domain.recommendation.model.ContentType.NEWS
                      and (:from is null or s.slotAt >= :from)
                      and (:to   is null or s.slotAt <  :to)
                    """
    )
    Page<NewsFeedItemDto> findNewsFeed(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query(value = """
            select s from UserRecommendationSlot s
              left join QuizAttempt qa
                on qa.quizId = s.quizId and qa.userId = :userId
            where s.userId = :userId
              and s.contentType = com.c102.picky.domain.recommendation.model.ContentType.QUIZ
              and s.status = com.c102.picky.domain.recommendation.model.SlotStatus.SCHEDULED
              and s.quizId is not null
            group by s
            order by case when count(qa.id) > 0 then 1 else 0 end,
                     s.priority asc,
                     s.slotAt asc,
                     s.id desc
            """,
            countQuery = """
                      select count(s) from UserRecommendationSlot s
                      where s.userId = :userId
                        and s.contentType = com.c102.picky.domain.recommendation.model.ContentType.QUIZ
                        and s.status = com.c102.picky.domain.recommendation.model.SlotStatus.SCHEDULED
                        and s.quizId is not null
                    """
    )
    Page<UserRecommendationSlot> findQuizSlotsForWindow(
            @Param("userId") Long userId,
            Pageable pageable
    );
}
