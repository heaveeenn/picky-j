package com.c102.picky.domain.auth.service;

import com.c102.picky.domain.auth.dto.GoogleLoginRequestDto;
import com.c102.picky.domain.auth.dto.RefreshTokenRequestDto;
import com.c102.picky.domain.auth.dto.TokenResponseDto;
import com.c102.picky.domain.users.dto.Role;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.users.repository.UserRepository;
import com.c102.picky.domain.userstats.entity.UserDailySummary;
import com.c102.picky.domain.userstats.repository.UserDailySummaryRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import com.c102.picky.global.security.jwt.JwtTokenProvider;
import com.c102.picky.global.util.CookieUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Arrays;
import java.util.Map;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;
    private final UserDailySummaryRepository userDailySummaryRepository;

    @Value("${app.oauth.google.web-client-id}")
    private String webClientId;

    @Value("${app.oauth.google.chrome-extension-client-id}")
    private String chromeExtensionClientId;

    @Override
    @Transactional
    public TokenResponseDto googleLogin(GoogleLoginRequestDto request) {
        String token = request.getToken(); // getToken() 메서드로 변경

        if (token == null || token.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        log.info("Google 로그인 요청 - 출처: {}, 토큰 타입: {}",
                request.getSource(),
                token.startsWith("ya29.") ? "Access Token" : "ID Token");

        // 토큰 타입 감지: Access Token은 ya29.로 시작, ID Token은 eyJ로 시작
        if (token.startsWith("ya29.")) {
            // Access Token 처리
            return handleAccessToken(token);
        } else if (token.startsWith("eyJ")) {
            // ID Token 처리
            return handleIdToken(token);
        } else {
            throw new ApiException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
    }

    private TokenResponseDto handleIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Arrays.asList(webClientId, chromeExtensionClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new ApiException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleSub = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            User user = userRepository.findByGoogleSub(googleSub)
                    .orElseGet(() -> {
                        User newUser = User.of(googleSub, email, name, picture, Role.USER);
                        UserDailySummary userDailySummary = UserDailySummary.builder()
                                .user(newUser)
                                .summaryDate(LocalDate.now().minusDays(1))
                                .totalSites(0L)
                                .totalTimeSpent(0L)
                                .build();
                        userDailySummaryRepository.save(userDailySummary);
                        return userRepository.save(newUser);
                    });

            return jwtTokenProvider.createTokenResponse(user.getGoogleSub(), user.getRole().name());

        } catch (GeneralSecurityException | IOException e) {
            log.error("Google ID token verification failed", e);
            throw new ApiException(ErrorCode.GOOGLE_TOKEN_VERIFICATION_FAILED);
        }
    }

    private TokenResponseDto handleAccessToken(String accessToken) {
        try {
            log.info("Access Token 처리 시작: {}", accessToken.substring(0, 10) + "...");

            // Google UserInfo API로 사용자 정보 직접 조회
            RestTemplate restTemplate = new RestTemplate();
            String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken;

            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = restTemplate.getForObject(userInfoUrl, Map.class);

            if (userInfo == null) {
                throw new ApiException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }

            // Google API 응답에서 정보 추출
            String googleSub = (String) userInfo.get("id");
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");
            String picture = (String) userInfo.get("picture");

            log.info("Google API에서 사용자 정보 조회 성공: sub={}, email={}", googleSub, email);

            // 사용자 조회 또는 생성
            User user = userRepository.findByGoogleSub(googleSub)
                    .orElseGet(() -> {
                        User newUser = User.of(googleSub, email, name, picture, Role.USER);
                        return userRepository.save(newUser);
                    });

            // 기존 JWT 시스템 그대로 사용
            return jwtTokenProvider.createTokenResponse(user.getGoogleSub(), user.getRole().name());

        } catch (Exception e) {
            log.error("Access token processing failed", e);
            throw new ApiException(ErrorCode.GOOGLE_TOKEN_VERIFICATION_FAILED);
        }
    }

    @Override
    public TokenResponseDto refreshToken(RefreshTokenRequestDto request) {
        String refreshToken = request.getRefreshToken();
        
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new ApiException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String googleSub = jwtTokenProvider.getSubject(refreshToken);
        User user = userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        return jwtTokenProvider.createTokenResponse(user.getGoogleSub(), user.getRole().name());
    }

    @Override
    public void logout(HttpServletRequest request) {
        // Authorization 헤더에서 access token 추출
        jwtTokenProvider.resolve(request).ifPresent(accessToken -> {
            if (jwtTokenProvider.validateToken(accessToken)) {
                jwtTokenProvider.addToBlacklist(accessToken);
                log.info("Access token added to blacklist");
            }
        });

        // 쿠키에서 refresh token 추출해서 블랙리스트에 추가
        cookieUtil.getRefreshTokenFromCookie(request).ifPresent(refreshToken -> {
            log.info("RefreshToken found in cookie: {}", refreshToken.substring(0, 20) + "...");
            
            if (jwtTokenProvider.validateToken(refreshToken)) {
                jwtTokenProvider.addToBlacklist(refreshToken);
                log.info("Refresh token from cookie added to blacklist successfully");
            } else {
                log.warn("RefreshToken validation failed, not adding to blacklist");
            }
        });
        
        // 쿠키에서 refreshToken을 찾지 못한 경우 로깅
        if (cookieUtil.getRefreshTokenFromCookie(request).isEmpty()) {
            log.warn("No refreshToken found in cookie during logout");
        }
        
        log.info("User logout processed");
    }
}