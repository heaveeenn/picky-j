package com.c102.picky.domain.quiz.repository;

import com.c102.picky.domain.quiz.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Set;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    @Query("""
                select distinct qa.quizId from QuizAttempt qa
                where qa.userId = :userId and qa.quizId in :quizIds
            """)
    Set<Long> findAttemptedQuizIds(@Param("userId") Long userId,
                                   @Param("quizIds") Collection<Long> quizIds);
}
