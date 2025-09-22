package com.c102.picky.domain.recommendation.controller;

import com.c102.picky.domain.recommendation.dto.RecommendationAckRequestDto;
import com.c102.picky.domain.recommendation.dto.RecommendationPayloadResponseDto;
import com.c102.picky.domain.recommendation.dto.RecommendationUpsertRequestDto;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.service.RecommendationService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
class RecommendationController {
    private final RecommendationService recommendationService;

    /**
     * 다음 팝업용 추천 1건 가져오기
     * @param request
     * @param type NEWS | QUIZ
     * @param windowStart 기본 : 정시
     * @param windowEnd 기본 : 정시 + 5분
     * @return
     */
    @GetMapping("/next")
    public ResponseEntity<ApiResponse<RecommendationPayloadResponseDto>> getNextRecommendation(
            HttpServletRequest request,
            @RequestParam ContentType type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)LocalDateTime windowStart,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)LocalDateTime windowEnd
            ) {
        Long userId = (Long) request.getAttribute("userId");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = windowStart != null ? windowStart : now.withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = windowEnd != null ? windowEnd : now.plusMinutes(5);

        var payload = recommendationService.getNextRecommendation(userId, type, start, end);

        if (payload == null) {
            return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "현재 추천할 콘텐츠를 준비중입니다. 잠시 후 다시 확인해주세요!", null, request.getRequestURI()));
        }

        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "추천 조회 성공", payload, request.getRequestURI()));
    }


    /**
     * 노출 / 클릭 / 닫기 등 사용자 상호작용 수집
     */
    @PatchMapping("/{slotId}/ack")
    public ResponseEntity<ApiResponse<Void>> acknowledgeRecommendation(
            HttpServletRequest request,
            @PathVariable Long slotId,
            @Valid @RequestBody RecommendationAckRequestDto dto
            ) {

        Long userId = (Long) request.getAttribute("userId");
        recommendationService.acknowledgeRecommendation(userId, slotId, dto);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "상호작용 기록 성공",  null, request.getRequestURI()));
    }

    /**
     *  (내부/패치) 슬롯 UPSERT
     */
    @PostMapping("/slots")
    public ResponseEntity<ApiResponse<Void>> upsertSlot(
            HttpServletRequest request,
            @Valid @RequestBody RecommendationUpsertRequestDto dto
    ) {
        recommendationService.upsertSlot(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(HttpStatus.CREATED, "슬롯 업서트 성공", null, request.getRequestURI()));
    }
}


