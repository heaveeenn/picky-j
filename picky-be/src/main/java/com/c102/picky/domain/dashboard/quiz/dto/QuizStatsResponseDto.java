package com.c102.picky.domain.dashboard.quiz.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizStatsResponseDto {

    private Long totalQuizAttempts;
    private Double accuracyRate;
    private Integer currentStreak;
    private Integer maxStreak;
}