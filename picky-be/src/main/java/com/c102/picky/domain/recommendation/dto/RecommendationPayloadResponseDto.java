package com.c102.picky.domain.recommendation.dto;

import com.c102.picky.domain.recommendation.model.ContentType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecommendationPayloadResponseDto {
    private Long slotId;
    private ContentType contentType;
    private Long contentId;
    private LocalDateTime slotAt;
    private String title;
    private String url;
    private String question;
    private Map<String, Object> extras;
}
