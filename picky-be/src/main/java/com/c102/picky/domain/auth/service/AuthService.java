package com.c102.picky.domain.auth.service;

import com.c102.picky.domain.auth.dto.GoogleLoginRequestDto;
import com.c102.picky.domain.auth.dto.RefreshTokenRequestDto;
import com.c102.picky.domain.auth.dto.TokenResponseDto;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    
    TokenResponseDto googleLogin(GoogleLoginRequestDto request);
    
    TokenResponseDto refreshToken(RefreshTokenRequestDto request);
    
    void logout(HttpServletRequest request);
}
