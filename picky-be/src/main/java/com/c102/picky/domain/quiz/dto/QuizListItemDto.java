package com.c102.picky.domain.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizListItemDto {

    private Long slotId;
    private Long quizId;
    private String title;
    private String question;
    private String url;
    private String rule;

    private Boolean isScrapped;
    private Boolean isAttempted;

    private Integer order;
}
