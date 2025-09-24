package com.c102.picky.domain.quiz.controller;

import com.c102.picky.domain.quiz.dto.QuizListItemDto;
import com.c102.picky.domain.quiz.service.QuizService;
import com.c102.picky.global.dto.ApiResponse;
import com.c102.picky.global.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /**
     * 추천 퀴즈 목록 (미시도 우선 정렬)
     * 기본 size=5, page=0
     * 목록에서는 정답/해설 비공개 (개별 퀴즈/정답 API로 확인)
     */
    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<PageResponse<QuizListItemDto>>> getRecommendedQuizzes(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "5") Integer size
    ) {
        Long userId = (Long) request.getAttribute("userId");
        var data = quizService.getQuizPage(userId, page, size);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "추천 퀴즈 목록 조회 성공", data, request.getRequestURI()));
    }
}
