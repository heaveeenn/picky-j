package com.c102.picky.global.security.oauth2;

import com.c203.autobiography.domain.member.entity.Member;
import com.c203.autobiography.domain.member.repository.MemberRepository;
import com.c203.autobiography.global.security.jwt.JwtTokenProvider;
import com.c203.autobiography.global.util.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService; // Redis
    private final AppProps appProps; // authorizedRediredtUris, cookie settings
    private final UsersRepository usersRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        var principal = (DefaultOAuth2User) authentication.getPrincipal();
        String sub = (String) principal.getAttributes().get("sub");

        // 이미 CustomOAuth2UserService에서 생성된 Member 조회
        Long userId = usersRepository.findByGoogleSub(sub)
                .orElseThrow(() -> new RuntimeException("OAuth2 사용자를 찾을 수 없습니다."));

        // JWT 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(userId, "USER");
        String refreshToken = jwtTokenProvider.createRefreshToken(userId, "USER");

        // Redis에 RefreshToken 저장
        refreshTokenService.store(userId, refreshToken);

        // RefreshToken을 쿠키로 저장
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge((int) Duration.ofDays(14).getSeconds());
        response.addCookie(cookie);

        // 프론트엔드 콜백 URL로 리다이렉트 (토큰 포함)
        String redirectUri = request.getParameter("redirect_uri");
        if (redirectUri != null && appProps.isAllowedRedirect(redirectUri)) {
            String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                    .queryParam("token", accessToken)
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } else {
            response.setContentType("application/json");
            response.getWriter().write("{\"accessToken\":\"" + accessToken + "\"}");
        }
    }
}