package com.c102.picky.domain.userstats.controller;

import com.c102.picky.domain.userstats.dto.*;
import com.c102.picky.domain.userstats.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dashboard")
public class SummaryController {

    private final DailyAggregateSummaryService dailyAggregateSummaryService;

    // 전날 전체 평균 요약 통계 조회
    @GetMapping("/summary")
    public ResponseEntity<DailyAggregateSummaryDto> getDailyAggregateSummary() {
        return ResponseEntity.ok(dailyAggregateSummaryService.getYesterdaySummary());
    }

    // 사용자 카테고리 별로 가장 많이 방문한 도메인 리스트 제공
    @GetMapping("/categories/summary")
    public ResponseEntity<List<CategorySummaryDto>> getCategorySummary() {
        return ResponseEntity.ok(dailyAggregateSummaryService.getCategorySummary());
    }

}
