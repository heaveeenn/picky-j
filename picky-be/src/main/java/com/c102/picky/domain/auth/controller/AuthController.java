package com.c102.picky.domain.auth.controller;

import com.c102.picky.domain.auth.dto.GoogleLoginRequestDto;
import com.c102.picky.domain.auth.dto.RefreshTokenRequestDto;
import com.c102.picky.domain.auth.dto.TokenResponseDto;
import com.c102.picky.domain.auth.service.AuthService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google/login")
    public ResponseEntity<ApiResponse<TokenResponseDto>> googleLogin(@Valid @RequestBody GoogleLoginRequestDto request, 
                                                                    HttpServletRequest httpRequest) {
        log.info("Google login request received with ID token");
        TokenResponseDto tokens = authService.googleLogin(request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "구글 로그인 성공", tokens, httpRequest.getRequestURI()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponseDto>> refreshToken(@Valid @RequestBody RefreshTokenRequestDto request,
                                                                     HttpServletRequest httpRequest) {
        log.info("Token refresh request received");
        TokenResponseDto tokens = authService.refreshToken(request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "토큰 갱신 성공", tokens, httpRequest.getRequestURI()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest) {
        log.info("Logout request received");
        authService.logout(httpRequest);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "로그아웃 성공", null, httpRequest.getRequestURI()));
    }
}