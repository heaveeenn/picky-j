package com.c102.picky.domain.scrap.controller;

import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.scrap.dto.ScrapCreateRequestDto;
import com.c102.picky.domain.scrap.dto.ScrapResponseDto;
import com.c102.picky.domain.scrap.service.ScrapService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scraps")
@RequiredArgsConstructor
public class ScrapController {

    private final ScrapService scrapService;

    @PostMapping
    public ResponseEntity<ApiResponse<ScrapResponseDto>> createScrap(
            HttpServletRequest request,
            @RequestBody ScrapCreateRequestDto dto
            ) {
        Long userId = (Long) request.getAttribute("userId");
        var saved = scrapService.createScrap(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(HttpStatus.CREATED, "스크랩 저장 성공", saved, request.getRequestURI()));
    }

    @DeleteMapping("/{scrapId}")
    public ResponseEntity<ApiResponse<ScrapResponseDto>> deleteScrap(
            HttpServletRequest request,
            @PathVariable("scrapId") Long scrapId
    ) {
        Long userId = (Long) request.getAttribute("userId");
        scrapService.deleteScrap(userId, scrapId);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "스크랩 삭제 성공", null, request.getRequestURI()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ScrapResponseDto>>> getScraps(
            HttpServletRequest request,
            @RequestParam(required = false)ContentType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) request.getAttribute("userId");
        var result = scrapService.getScraps(userId, type, page, size);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "스크랩 목록 조회 성공", result, request.getRequestURI()));
    }

    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<ScrapResponseDto>> toggleScrap(
            HttpServletRequest request,
            @RequestBody ScrapCreateRequestDto dto
    ) {
        Long userId = (Long) request.getAttribute("userId");
        var result = scrapService.toggleScrap(userId, dto);
        String message = result != null ? "스크랩 저장 성공" : "스크랩 취소 성공";
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, message, result, request.getRequestURI()));
    }
}
