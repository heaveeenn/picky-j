package com.c102.picky.domain.userstats.controller;

import com.c102.picky.domain.users.entity.CustomUserDetails;
import com.c102.picky.domain.userstats.dto.*;
import com.c102.picky.domain.userstats.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dashboard/userstats")
public class UserStatsController {

    private final UserStatsService userStatsService;
    private final UserHourlyStatsService userHourlyStatsService;
    private final UserCategoryStatsService userCategoryStatsService;
    private final UserDomainStatsService userDomainStatsService;
    private final UserDailySummaryService userDailySummaryService;

    // 전체 통계 조회
    @GetMapping()
    public ResponseEntity<UserStatsDto> getUserStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userStatsService.getUserStats(userDetails.getUser().getId()));
    }

    // 시간대별 통계 조회
    @GetMapping("/hourly")
    public ResponseEntity<List<UserHourlyStatsDto>> getUserHourlyStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userHourlyStatsService.getUserHourlyStats(userDetails.getUser().getId()));
    }

    // 카테고리별 통계 조회
    @GetMapping("/categories")
    public ResponseEntity<List<UserCategoryStatsDto>> getUserCategoryStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userCategoryStatsService.getUserCategoryStats(userDetails.getUser().getId()));
    }

    // 도메인별 통계 조회
    @GetMapping("/domains")
    public ResponseEntity<List<UserDomainStatsDto>> getUserDomainStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userDomainStatsService.getUserDomainStats(userDetails.getUser().getId()));
    }

    // 전날 사용자 평균 차이 요약 통계 조회
    @GetMapping("/summary")
    public ResponseEntity<UserVsAverageDto> getUserDailySummary(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userDailySummaryService.getUserVsAverage(userDetails.getUser().getId()));
    }

    // 카테고리별 사용자 분포
    @GetMapping("/categories/visit-share")
    public ResponseEntity<List<CategoryVisitShareDto>> getVisitShare() {
        return ResponseEntity.ok(userCategoryStatsService.getCategoryVisitShare());
    }
}
