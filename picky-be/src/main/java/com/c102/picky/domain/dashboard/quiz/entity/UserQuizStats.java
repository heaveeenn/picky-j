package com.c102.picky.domain.dashboard.quiz.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_quiz_stats",
    indexes = {
        @Index(name = "idx_user_quiz_stats_user", columnList = "user_id", unique = true),
        @Index(name = "idx_user_quiz_stats_updated", columnList = "updated_at")
    }
)
public class UserQuizStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "current_streak", nullable = false)
    @Builder.Default
    private Integer currentStreak = 0;

    @Column(name = "max_streak", nullable = false)
    @Builder.Default
    private Integer maxStreak = 0;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void updateStreak(boolean isCorrect) {
        if (isCorrect) {
            this.currentStreak++;
            if (this.currentStreak > this.maxStreak) {
                this.maxStreak = this.currentStreak;
            }
        } else {
            this.currentStreak = 0;
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) this.createdAt = LocalDateTime.now();
        if (updatedAt == null) this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}