package com.c102.picky.domain.dashboard.quiz.repository;

import com.c102.picky.domain.dashboard.quiz.entity.QuizView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizViewRepository extends JpaRepository<QuizView, Long> {

    @Query("SELECT COUNT(qv) FROM QuizView qv WHERE qv.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(qv) FROM QuizView qv WHERE qv.userId = :userId AND qv.isCorrect = true")
    long countCorrectByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndQuizId(Long userId, Long quizId);
}