package com.c102.picky.domain.content.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NewsPayloadDto {
    private Long id;
    private String title;
    private String url;
    private String summary;
    private LocalDateTime publishedAt;

    // 카테고리까지 함께 반환
    private Long categoryId;
    private String categoryName;
}
