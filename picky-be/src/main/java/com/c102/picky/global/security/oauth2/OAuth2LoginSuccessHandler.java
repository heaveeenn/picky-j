package com.c102.picky.global.security.oauth2;

import com.c102.picky.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        
        log.info("OAuth2 login success for user: {}", authentication.getName());
        
        try {
            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(authentication);
            String refreshToken = jwtTokenProvider.createRefreshToken(authentication);
            
            // 팝업 창에 토큰을 전달하는 HTML 응답
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
                
        } catch (Exception e) {
            log.error("Error during OAuth2 success handling", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Authentication success handling failed");
        }
    }
}