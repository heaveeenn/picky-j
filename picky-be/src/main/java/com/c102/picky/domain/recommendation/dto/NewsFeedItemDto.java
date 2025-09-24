package com.c102.picky.domain.recommendation.dto;

import java.time.LocalDateTime;

public record NewsFeedItemDto(
        Long slotId,
        Long newsId,
        String title,
        String summary,
        String url,
        String categoryName,
        LocalDateTime publishedAt,
        int priority,
        LocalDateTime slotAt,
        String reason
) {
}
