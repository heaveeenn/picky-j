package com.c102.picky.global.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        
        log.error("OAuth2 login failed: {}", exception.getMessage());
        
        // 팝업 창에 실패 정보를 전달하는 HTML 응답
        response.setContentType("text/html;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>OAuth2 Login Failed</title>
            </head>
            <body>
                <script>
                    // 부모 창에 실패 정보 전달
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'OAUTH2_FAILURE',
                            error: 'OAuth2 login failed',
                            message: '%s'
                        }, '*');
                        window.close();
                    } else {
                        // 팝업이 아닌 경우 에러 페이지로 리다이렉트
                        window.location.href = 'http://localhost:5173/login?error=oauth2_failed';
                    }
                </script>
                <p>로그인 실패: %s</p>
                <p>창이 자동으로 닫힙니다...</p>
            </body>
            </html>
            """.formatted(exception.getMessage(), exception.getMessage()));
    }
}