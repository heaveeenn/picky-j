package com.c102.picky.domain.dashboard.news.service;

import com.c102.picky.domain.dashboard.news.dto.NewsStatsResponseDto;
import com.c102.picky.domain.dashboard.news.dto.TrendingNewsResponseDto;

import java.util.List;

public interface DashboardNewsService {

    NewsStatsResponseDto getNewsStats(Long userId);

    void recordNewsView(Long userId, Long newsId);

    List<TrendingNewsResponseDto> getTrendingNews(int limit);
}