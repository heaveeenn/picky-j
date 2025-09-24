package com.c102.picky.domain.dashboard.news.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NewsStatsResponseDto {

    private Long weeklyNewsConsumption;
    private Long totalNewsViewed;
}