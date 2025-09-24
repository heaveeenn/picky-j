package com.c102.picky.domain.recommendation.entity;

import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.model.SlotStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_recommendation_slots",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_slot_type", columnNames = {"user_id", "content_type", "slot_at"})
        },
        indexes = {
                @Index(name = "idx_user_time", columnList = "user_id, slot_at"),
                @Index(name = "idx_news", columnList = "news_id"),
                @Index(name = "idx_quiz", columnList = "quiz_id"),
                @Index(name = "idx_fact", columnList = "fact_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRecommendationSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 10)
    private ContentType contentType;

    // news.id (content_type=NEWS일 때만)
    @Column(name = "news_id")
    private Long newsId;

    // quiz.id (content_type=QUIZ일 때만)
    @Column(name = "quiz_id")
    private Long quizId;

    // fact.id (content_type=FACT일 때만)
    @Column(name = "fact_id")
    private Long factId;

    // 알림 슬롯 시간
    @Column(name = "slot_at", nullable = false)
    private LocalDateTime slotAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 12)
    @Builder.Default
    private SlotStatus status = SlotStatus.SCHEDULED;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private int priority = 5;

    @Lob
    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // 편의메서드 : contentId 공통 취득
    public Long getContentId() {
        return switch (contentType) {
            case NEWS -> newsId;
            case QUIZ -> quizId;
            case FACT -> factId;
        };
    }
}
