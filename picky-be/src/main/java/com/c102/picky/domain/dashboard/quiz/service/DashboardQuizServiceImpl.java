package com.c102.picky.domain.dashboard.quiz.service;

import com.c102.picky.domain.dashboard.quiz.dto.QuizStatsResponseDto;
import com.c102.picky.domain.dashboard.quiz.entity.QuizView;
import com.c102.picky.domain.dashboard.quiz.entity.UserQuizStats;
import com.c102.picky.domain.dashboard.quiz.repository.QuizViewRepository;
import com.c102.picky.domain.dashboard.quiz.repository.UserQuizStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardQuizServiceImpl implements DashboardQuizService {

    private final QuizViewRepository quizViewRepository;
    private final UserQuizStatsRepository userQuizStatsRepository;

    @Override
    public QuizStatsResponseDto getQuizStats(Long userId) {
        long totalQuizAttempts = quizViewRepository.countByUserId(userId);
        long correctAnswers = quizViewRepository.countCorrectByUserId(userId);
        double accuracyRate = totalQuizAttempts == 0 ? 0.0 : (double) correctAnswers / totalQuizAttempts * 100;

        UserQuizStats stats = userQuizStatsRepository.findByUserId(userId)
                .orElse(UserQuizStats.builder().userId(userId).build());

        return QuizStatsResponseDto.builder()
                .totalQuizAttempts(totalQuizAttempts)
                .accuracyRate(accuracyRate)
                .currentStreak(stats.getCurrentStreak())
                .maxStreak(stats.getMaxStreak())
                .build();
    }

    @Override
    @Transactional
    public void recordQuizView(Long userId, Long quizId, Boolean userAnswer, boolean isCorrect) {
        if (!quizViewRepository.existsByUserIdAndQuizId(userId, quizId)) {
            QuizView quizView = QuizView.builder()
                    .userId(userId)
                    .quizId(quizId)
                    .userAnswer(userAnswer)
                    .isCorrect(isCorrect)
                    .build();
            quizViewRepository.save(quizView);
        }

        UserQuizStats stats = userQuizStatsRepository.findByUserId(userId)
                .orElse(UserQuizStats.builder().userId(userId).build());

        stats.updateStreak(isCorrect);
        userQuizStatsRepository.save(stats);
    }
}