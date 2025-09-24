package com.c102.picky.domain.dashboard.news.service;

import com.c102.picky.domain.dashboard.news.dto.NewsStatsResponseDto;

public interface DashboardNewsService {

    NewsStatsResponseDto getNewsStats(Long userId);

    void recordNewsView(Long userId, Long newsId);
}