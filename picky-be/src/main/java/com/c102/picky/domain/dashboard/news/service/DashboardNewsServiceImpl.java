package com.c102.picky.domain.dashboard.news.service;

import com.c102.picky.domain.dashboard.news.dto.NewsStatsResponseDto;
import com.c102.picky.domain.dashboard.news.entity.NewsView;
import com.c102.picky.domain.dashboard.news.repository.NewsViewRepository;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
        LocalDateTime weekStart = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS).minusDays(6);
        LocalDateTime weekEnd = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS).plusDays(1);

        long weeklyNewsConsumption = newsViewRepository.countByUserIdAndViewedAtBetween(
                userId, weekStart, weekEnd);

        long totalNewsViewed = newsViewRepository.countByUserId(userId);

        return NewsStatsResponseDto.builder()
                .weeklyNewsConsumption(weeklyNewsConsumption)
                .totalNewsViewed(totalNewsViewed)
                .build();
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