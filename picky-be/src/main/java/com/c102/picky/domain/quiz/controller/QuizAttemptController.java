package com.c102.picky.domain.quiz.controller;

import com.c102.picky.domain.content.dto.QuizPayloadDto;
import com.c102.picky.domain.content.service.ContentQueryService;
import com.c102.picky.domain.dashboard.quiz.service.DashboardQuizService;
import com.c102.picky.domain.quiz.dto.QuizAnswerResponseDto;
import com.c102.picky.domain.quiz.dto.QuizAttemptCreateRequestDto;
import com.c102.picky.domain.quiz.entity.QuizAttempt;
import com.c102.picky.domain.quiz.repository.QuizAttemptRepository;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizAttemptController {

    private final ContentQueryService contentQueryService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final DashboardQuizService dashboardQuizService;

    @GetMapping("/{quizId}")
    public ResponseEntity<ApiResponse<QuizPayloadDto>> getQuiz(
            HttpServletRequest request,
            @PathVariable Long quizId
    ) {
        var quiz = contentQueryService.getQuizPayload(quizId, false, false);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "퀴즈 조회 성공", quiz, request.getRequestURI()));
    }

    @PostMapping("/{quizId}/answer")
    public ResponseEntity<ApiResponse<QuizAnswerResponseDto>> checkAnswer(
            HttpServletRequest request,
            @PathVariable Long quizId,
            @RequestBody QuizAttemptCreateRequestDto dto
            ) {
        Long userId = (Long) request.getAttribute("userId");

        var quiz = contentQueryService.getQuizPayload(quizId, true, true);
        boolean isCorrect = (quiz.getAnswer() != null && quiz.getAnswer().equals(dto.getUserAnswer()));

        quizAttemptRepository.save(QuizAttempt.builder()
                .quizId(quizId)
                .userId(userId)
                .userAnswer(dto.getUserAnswer())
                .isCorrect(isCorrect)
                .slotId(dto.getSlotId())
                .build());

        dashboardQuizService.recordQuizView(userId, quizId, dto.getUserAnswer(), isCorrect);

        var response = QuizAnswerResponseDto.builder()
                .quizId(quizId)
                .userAnswer(dto.getUserAnswer())
                .correctAnswer(quiz.getAnswer())
                .isCorrect(isCorrect)
                .explanation(quiz.getExplanation())
                .build();

        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "정답 확인 성공", response, request.getRequestURI()));
    }
}
