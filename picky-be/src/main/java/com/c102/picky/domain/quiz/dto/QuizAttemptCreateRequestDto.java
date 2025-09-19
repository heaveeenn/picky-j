package com.c102.picky.domain.quiz.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizAttemptCreateRequestDto {
    private Boolean userAnswer;
    private Long slotId;
}
