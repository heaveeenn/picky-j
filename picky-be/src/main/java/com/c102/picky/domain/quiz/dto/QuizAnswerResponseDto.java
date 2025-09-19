package com.c102.picky.domain.quiz.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswerResponseDto {
    private Long quizId;
    private Boolean userAnswer;
    private Boolean correctAnswer;
    private Boolean isCorrect;
    private String explanation;
}
