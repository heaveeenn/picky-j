package com.c102.picky.domain.dashboard.quiz.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quiz_views",
    indexes = {
        @Index(name = "idx_quiz_views_user_time", columnList = "user_id, viewed_at"),
        @Index(name = "idx_quiz_views_quiz_time", columnList = "quiz_id, viewed_at"),
        @Index(name = "idx_quiz_views_user_quiz", columnList = "user_id, quiz_id", unique = true)
    }
)
public class QuizView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "user_answer")
    private Boolean userAnswer;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    @Column(name = "viewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime viewedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        if (viewedAt == null) this.viewedAt = LocalDateTime.now();
        if (createdAt == null) this.createdAt = LocalDateTime.now();
    }
}