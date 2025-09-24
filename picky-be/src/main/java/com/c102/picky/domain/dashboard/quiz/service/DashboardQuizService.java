package com.c102.picky.domain.dashboard.quiz.service;

import com.c102.picky.domain.dashboard.quiz.dto.QuizStatsResponseDto;

public interface DashboardQuizService {

    QuizStatsResponseDto getQuizStats(Long userId);

    void recordQuizView(Long userId, Long quizId, Boolean userAnswer, boolean isCorrect);
}