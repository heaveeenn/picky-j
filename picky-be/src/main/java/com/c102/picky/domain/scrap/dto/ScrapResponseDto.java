package com.c102.picky.domain.scrap.dto;

import com.c102.picky.domain.recommendation.model.ContentType;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrapResponseDto {
    private Long scrapId;
    private ContentType contentType;
    private Long contentId;
    private String note;
    private String labelsJson;
    private LocalDateTime createdAt;
    private String title;
    private String url;
}
