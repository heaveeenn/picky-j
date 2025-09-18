package com.c102.picky.domain.content.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizPayloadDto {
    private Long id;
    private String title;
    private String question;
    private String url;
    private String rule;
    private String explanation;
    private Boolean answer;
}
