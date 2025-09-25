package com.c102.picky.domain.dashboard.news.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TrendingNewsResponseDto {
    private Long newsId;
    private String title;
    private String url;
    private String summary;
    private Long viewerCount;
    private String publishedAt;
    private Long categoryId;
    private String categoryName;
}