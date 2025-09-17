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
@RequestMapping("/api/users/{userId}/interests")
public class UserInterestCategoryController {

    private final UserInterestCategoryService uiService;

    private void validateUserAccess(Long pathUserId, HttpServletRequest request) {
        Long jwtUserId = (Long) request.getAttribute("userId");
        if (jwtUserId == null || !jwtUserId.equals(pathUserId)) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }
    }

    /** 관심 카테고리 등록(복수) — L1만 허용 */
    @PostMapping
    public ResponseEntity<ApiResponse<List<UserInterestResponseDto>>> addUserInterests(
            @PathVariable Long userId,
            @Valid @RequestBody UserInterestAddRequestDto request,
            HttpServletRequest httpRequest
    ) {
        validateUserAccess(userId, httpRequest);
        List<UserInterestResponseDto> response = uiService.addUserInterests(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(HttpStatus.CREATED, "관심 카테고리 등록 성공", response, httpRequest.getRequestURI()));
    }

    /** 관심 카테고리 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserInterestResponseDto>>> findUserInterests(
            @PathVariable Long userId,
            HttpServletRequest httpRequest
    ) {
        validateUserAccess(userId, httpRequest);
        List<UserInterestResponseDto> response = uiService.findUserInterests(userId);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "관심 카테고리 조회 성공", response, httpRequest.getRequestURI()));
    }

    /** 관심 카테고리 삭제(단건) */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> removeUserInterest(
            @PathVariable Long userId,
            @PathVariable Long categoryId,
            HttpServletRequest httpRequest
    ) {
        validateUserAccess(userId, httpRequest);
        uiService.removeUserInterest(userId, categoryId);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "관심 카테고리 삭제 성공", null, httpRequest.getRequestURI()));
    }
}
