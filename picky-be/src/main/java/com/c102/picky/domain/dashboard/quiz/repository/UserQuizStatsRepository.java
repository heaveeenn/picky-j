package com.c102.picky.domain.dashboard.quiz.repository;

import com.c102.picky.domain.dashboard.quiz.entity.UserQuizStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserQuizStatsRepository extends JpaRepository<UserQuizStats, Long> {

    Optional<UserQuizStats> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}