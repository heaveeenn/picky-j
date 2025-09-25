package com.c102.picky.global.security.oauth2;

import com.c102.picky.domain.users.dto.UserResponseDto;
import com.c102.picky.domain.users.service.UserService;
import com.c102.picky.global.security.jwt.JwtTokenProvider;
import com.c102.picky.global.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final CookieUtil cookieUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        log.info("OAuth2 login success for user: {}", authentication.getName());

        // registrationId 기반으로 Extension vs 웹 대시보드 요청 구분
        OAuth2AuthenticationToken oauth2Token = (OAuth2AuthenticationToken) authentication;
        String registrationId = oauth2Token.getAuthorizedClientRegistrationId();
        boolean isExtensionRequest = "google-extension".equals(registrationId);

        log.info("OAuth2 요청 구분 - RegistrationId: {}, Extension: {}",
                registrationId, isExtensionRequest);

        try {
            // Authentication에서 사용자 정보 추출
            DefaultOAuth2User oAuth2User = (DefaultOAuth2User) authentication.getPrincipal();
            String googleSub = authentication.getName(); // OAuth2에서는 sub 값이 name으로 들어옴
            String email =  (String)oAuth2User.getAttributes().getOrDefault("email", "");
            String nickname = (String) oAuth2User.getAttributes().getOrDefault("name", "");
            String profileImage =  (String) oAuth2User.getAttributes().getOrDefault("picture", "");
            String role = "USER"; // 기본 역할 설정 (필요에 따라 수정)

            // upsert 실행
            UserResponseDto user = userService.upsertGoogleUser(googleSub, email, nickname, profileImage);
//            log.info("User Upsert Success!! : {}", user);

            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(googleSub, role);
            String refreshToken = jwtTokenProvider.createRefreshToken(googleSub);
            
            // refresh token을 쿠키에 저장
            cookieUtil.addRefreshTokenCookie(response, refreshToken);
            log.info("RefreshToken cookie set for user: {}", googleSub);
            
            if (isExtensionRequest) {
                // Extension 요청: URL Fragment로 토큰 전달
                String redirectUrl = String.format("https://%s.chromiumapp.org/?success=true&access_token=%s&refresh_token=%s",
                        "hfacdgjgkmaebgmmbfancbaeofhfijda", accessToken, refreshToken);

                response.sendRedirect(redirectUrl);
            } else {
                // 웹 대시보드 요청: 기존 방식
                response.setContentType("text/html;charset=UTF-8");
                response.getWriter().write("""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>OAuth2 Login Success</title>
                    </head>
                    <body>
                        <script>
                            // 부모 창에 토큰 정보 전달
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'OAUTH2_SUCCESS',
                                    accessToken: '%s',
                                    refreshToken: '%s'
                                }, '*');
                                window.close();
                            } else {
                                // 팝업이 아닌 경우 메인 페이지로 리다이렉트
                                window.location.href = 'http://localhost:5173';
                            }
                        </script>
                        <p>로그인 성공! 창이 자동으로 닫힙니다...</p>
                    </body>
                    </html>
                    """.formatted(accessToken, refreshToken));
            }
                
        } catch (Exception e) {
            log.error("Error during OAuth2 success handling", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Authentication success handling failed");
        }
    }
}