package com.c102.picky.domain.dashboard.news.controller;

import com.c102.picky.domain.dashboard.news.dto.NewsStatsResponseDto;
import com.c102.picky.domain.dashboard.news.dto.TrendingNewsResponseDto;

import java.util.List;
import com.c102.picky.domain.dashboard.news.service.DashboardNewsService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dashboard/news")
public class DashboardNewsController {

    private final DashboardNewsService dashboardNewsService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<NewsStatsResponseDto>> getNewsStats(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");

        NewsStatsResponseDto response = dashboardNewsService.getNewsStats(userId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "뉴스 통계 조회 성공", response, request.getRequestURI()));
    }

    @PostMapping("/{newsId}/view")
    public ResponseEntity<ApiResponse<Void>> recordNewsView(HttpServletRequest request,
                                                           @PathVariable Long newsId) {
        Long userId = (Long) request.getAttribute("userId");

        dashboardNewsService.recordNewsView(userId, newsId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "뉴스 조회 기록 성공", null, request.getRequestURI()));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<TrendingNewsResponseDto>>> getTrendingNews(
            HttpServletRequest request,
            @RequestParam(defaultValue = "5") int limit) {

        List<TrendingNewsResponseDto> trendingNews = dashboardNewsService.getTrendingNews(limit);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "트렌드 뉴스 조회 성공", trendingNews, request.getRequestURI()));
    }
}