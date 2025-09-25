package com.c102.picky.domain.dashboard.news.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class NewsStatsResponseDto {

    private Long weeklyNewsConsumption;
    private Long totalNewsViewed;
    private List<DailyNewsConsumption> dailyConsumption; // 월~일 일별 소비량

    @Getter
    @Builder
    public static class DailyNewsConsumption {
        private String dayOfWeek; // "MONDAY", "TUESDAY", ...
        private Long count;
    }
}