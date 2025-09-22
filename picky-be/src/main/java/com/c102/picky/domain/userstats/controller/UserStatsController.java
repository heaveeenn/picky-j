package com.c102.picky.domain.userstats.controller;

import com.c102.picky.domain.users.entity.CustomUserDetails;
import com.c102.picky.domain.userstats.dto.UserCategoryStatsDto;
import com.c102.picky.domain.userstats.dto.UserDomainStatsDto;
import com.c102.picky.domain.userstats.dto.UserHourlyStatsDto;
import com.c102.picky.domain.userstats.dto.UserStatsDto;
import com.c102.picky.domain.userstats.service.UserCategoryStatsService;
import com.c102.picky.domain.userstats.service.UserDomainStatsService;
import com.c102.picky.domain.userstats.service.UserHourlyStatsService;
import com.c102.picky.domain.userstats.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/userstats")
public class UserStatsController {

    private final UserStatsService userStatsService;
    private final UserHourlyStatsService userHourlyStatsService;
    private final UserCategoryStatsService userCategoryStatsService;
    private final UserDomainStatsService userDomainStatsService;

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

}
