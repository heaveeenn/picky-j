package com.c102.picky.domain.dashboard.news.service;

import com.c102.picky.domain.dashboard.news.dto.NewsStatsResponseDto;
import com.c102.picky.domain.dashboard.news.entity.NewsView;
import com.c102.picky.domain.dashboard.news.repository.NewsViewRepository;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardNewsServiceImpl implements DashboardNewsService {

    private final NewsViewRepository newsViewRepository;

    @Override
    public NewsStatsResponseDto getNewsStats(Long userId) {
        // 현재 주 월요일 00:00:00부터 다음 주 월요일 00:00:00까지
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekStart = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .truncatedTo(ChronoUnit.DAYS);
        LocalDateTime weekEnd = weekStart.plusWeeks(1);

        long weeklyNewsConsumption = newsViewRepository.countByUserIdAndViewedAtBetween(
                userId, weekStart, weekEnd);

        long totalNewsViewed = newsViewRepository.countByUserId(userId);

        // 일별 소비량 조회
        Object[][] dailyData = newsViewRepository.findDailyConsumptionByWeek(userId, weekStart, weekEnd);
        List<NewsStatsResponseDto.DailyNewsConsumption> dailyConsumption = buildDailyConsumption(dailyData);

        return NewsStatsResponseDto.builder()
                .weeklyNewsConsumption(weeklyNewsConsumption)
                .totalNewsViewed(totalNewsViewed)
                .dailyConsumption(dailyConsumption)
                .build();
    }

    private List<NewsStatsResponseDto.DailyNewsConsumption> buildDailyConsumption(Object[][] dailyData) {
        // MySQL DAYOFWEEK: 1=일요일, 2=월요일, ..., 7=토요일
        String[] dayNames = {"SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"};

        Map<Integer, Long> dayCountMap = new HashMap<>();
        for (Object[] row : dailyData) {
            Integer dayOfWeek = (Integer) row[0];
            Long count = ((Number) row[1]).longValue();
            dayCountMap.put(dayOfWeek, count);
        }

        List<NewsStatsResponseDto.DailyNewsConsumption> result = new ArrayList<>();
        // 월요일부터 시작하도록 정렬 (2=월요일, 3=화요일, ..., 7=토요일, 1=일요일)
        int[] weekOrder = {2, 3, 4, 5, 6, 7, 1}; // 월~일 순서

        for (int dayOfWeek : weekOrder) {
            String dayName = dayNames[dayOfWeek - 1]; // 배열은 0부터 시작
            Long count = dayCountMap.getOrDefault(dayOfWeek, 0L);

            result.add(NewsStatsResponseDto.DailyNewsConsumption.builder()
                    .dayOfWeek(dayName)
                    .count(count)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional
    public void recordNewsView(Long userId, Long newsId) {
        if (!newsViewRepository.existsByUserIdAndNewsId(userId, newsId)) {
            NewsView newsView = NewsView.builder()
                    .userId(userId)
                    .newsId(newsId)
                    .build();
            newsViewRepository.save(newsView);
        }
    }
}