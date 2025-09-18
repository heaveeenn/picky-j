package com.c102.picky.domain.quiz.repository;

import com.c102.picky.domain.quiz.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {}
