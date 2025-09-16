package com.c102.picky.domain.auth.controller;

import com.c102.picky.domain.auth.dto.GoogleLoginRequestDto;
import com.c102.picky.domain.auth.dto.RefreshTokenRequestDto;
import com.c102.picky.domain.auth.dto.TokenResponseDto;
import com.c102.picky.domain.auth.service.AuthService;
import com.c102.picky.global.dto.ApiResponse;
import com.c102.picky.global.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

//    @PostMapping("/google/login")
//    public ResponseEntity<ApiResponse<TokenResponseDto>> googleLogin(@Valid @RequestBody GoogleLoginRequestDto request,
//                                                                    HttpServletRequest httpRequest,
//                                                                    HttpServletResponse httpResponse) {
//        log.info("Google login request received with ID token");
//        TokenResponseDto tokens = authService.googleLogin(request);
//
//        // refresh token을 쿠키에 저장
//        cookieUtil.addRefreshTokenCookie(httpResponse, tokens.getRefreshToken());
//
//        return ResponseEntity.status(HttpStatus.OK)
//                .body(ApiResponse.of(HttpStatus.OK, "구글 로그인 성공", tokens, httpRequest.getRequestURI()));
//    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponseDto>> refreshToken(HttpServletRequest httpRequest,
                                                                     HttpServletResponse httpResponse) {
        log.info("Token refresh request received");
        
        // 쿠키에서 refresh token 읽기
        String refreshTokenFromCookie = cookieUtil.getRefreshTokenFromCookie(httpRequest)
                .orElseThrow(() -> new RuntimeException("RefreshToken not found in cookie"));
        
        // RefreshTokenRequestDto 생성
        RefreshTokenRequestDto request = new RefreshTokenRequestDto(refreshTokenFromCookie);
        TokenResponseDto tokens = authService.refreshToken(request);
        
        // 새로운 refresh token을 쿠키에 저장
        cookieUtil.addRefreshTokenCookie(httpResponse, tokens.getRefreshToken());
        
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "토큰 갱신 성공", tokens, httpRequest.getRequestURI()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest, 
                                                   HttpServletResponse httpResponse) {
        log.info("Logout request received");
        
        // 쿠키 삭제하기 전에 먼저 토큰들을 블랙리스트에 추가
        authService.logout(httpRequest);
        
        // refresh token 쿠키 삭제 (블랙리스트 추가 후)
        cookieUtil.deleteRefreshTokenCookie(httpResponse);
        log.info("RefreshToken cookie deleted");
        
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "로그아웃 성공", null, httpRequest.getRequestURI()));
    }
}