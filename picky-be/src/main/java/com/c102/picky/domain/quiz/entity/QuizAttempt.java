package com.c102.picky.domain.quiz.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quiz_attempts",
        indexes = {
            @Index(name = "idx_attempt_user_time", columnList = "user_id, attempted_at"),
            @Index(name = "idx_attempt_quiz_time", columnList = "quiz_id, attempted_id"),
            @Index(name = "idx_attempt_slot", columnList = "slot_id")
        }
)
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_answer")
    private Boolean userAnswer;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    @Column(name = "slot_id")
    private Long slotId;

    @Column(name = "attempted_at", nullable = false)
    @Builder.Default
    private LocalDateTime attemptedAt = LocalDateTime.now();

    @Column(name="created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        if (attemptedAt == null) this.attemptedAt = LocalDateTime.now();
        if (createdAt == null) this.createdAt = LocalDateTime.now();
    }
}
