package com.c102.picky.domain.userinterest.controller;

import com.c102.picky.domain.userinterest.dto.UserInterestAddRequestDto;
import com.c102.picky.domain.userinterest.dto.UserInterestResponseDto;
import com.c102.picky.domain.userinterest.service.UserInterestCategoryService;
import com.c102.picky.global.dto.ApiResponse;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users/me/interests")
public class UserInterestCategoryController {

    private final UserInterestCategoryService uiService;

    private void validateUserAccess(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }
    }

    /** 관심 카테고리 등록(복수) — L1만 허용 */
    @PostMapping
    public ResponseEntity<ApiResponse<List<UserInterestResponseDto>>> addUserInterests(
            @Valid @RequestBody UserInterestAddRequestDto request,
            HttpServletRequest httpRequest
    ) {
        validateUserAccess(httpRequest);
        Long userId = (Long) httpRequest.getAttribute("userId");
        List<UserInterestResponseDto> response = uiService.addUserInterests(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(HttpStatus.CREATED, "관심 카테고리 등록 성공", response, httpRequest.getRequestURI()));
    }

    /** 관심 카테고리 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserInterestResponseDto>>> findUserInterests(
            HttpServletRequest httpRequest
    ) {
        validateUserAccess(httpRequest);
        Long userId = (Long) httpRequest.getAttribute("userId");
        List<UserInterestResponseDto> response = uiService.findUserInterests(userId);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "관심 카테고리 조회 성공", response, httpRequest.getRequestURI()));
    }

    /** 관심 카테고리 삭제(단건) */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> removeUserInterest(
            @PathVariable Long categoryId,
            HttpServletRequest httpRequest
    ) {
        validateUserAccess(httpRequest);
        Long userId = (Long) httpRequest.getAttribute("userId");
        uiService.removeUserInterest(userId, categoryId);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "관심 카테고리 삭제 성공", null, httpRequest.getRequestURI()));
    }
}
