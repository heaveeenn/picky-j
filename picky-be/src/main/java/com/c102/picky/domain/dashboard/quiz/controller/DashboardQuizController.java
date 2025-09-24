package com.c102.picky.domain.dashboard.quiz.controller;

import com.c102.picky.domain.dashboard.quiz.dto.QuizStatsResponseDto;
import com.c102.picky.domain.dashboard.quiz.service.DashboardQuizService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dashboard/quiz")
public class DashboardQuizController {

    private final DashboardQuizService dashboardQuizService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<QuizStatsResponseDto>> getQuizStats(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");

        QuizStatsResponseDto response = dashboardQuizService.getQuizStats(userId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "퀴즈 통계 조회 성공", response, request.getRequestURI()));
    }
}