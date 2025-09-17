package com.c102.picky.domain.usersettings.controller;

import com.c102.picky.domain.usersettings.dto.UserSettingsResponseDto;
import com.c102.picky.domain.usersettings.dto.UserSettingsUpdateRequestDto;
import com.c102.picky.domain.usersettings.service.UserSettingsService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me/settings")
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    /**
     * 내 알림 설정 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserSettingsResponseDto>> getUserSettings(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        UserSettingsResponseDto response = userSettingsService.findByUserId(userId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "알림 설정 조회 성공", response, request.getRequestURI()));
    }

    /**
     * 내 알림 설정 수정
     */
    @PutMapping
    public ResponseEntity<ApiResponse<UserSettingsResponseDto>> updateSettings(
            HttpServletRequest request, @RequestBody UserSettingsUpdateRequestDto dto
            ) {
        Long userId = (Long) request.getAttribute("userId");
        UserSettingsResponseDto response = userSettingsService.updateSettings(userId, dto);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "알림 설정 수정 성공", response, request.getRequestURI()));
    }
}
