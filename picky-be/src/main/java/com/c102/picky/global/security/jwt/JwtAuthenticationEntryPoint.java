package com.c102.picky.global.security.jwt;

import com.c102.picky.global.exception.ErrorCode;
import com.c102.picky.global.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper om = new ObjectMapper();
    private final ObjectMapper objectMapper;

    /** 401 인증 실패(토큰 없음/만료/위조) */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {

        try {
            ErrorCode code = (ErrorCode) request.getAttribute("errorCode");
            if (code == null) code = ErrorCode.INVALID_TOKEN;

            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(code.getStatus().value());

            var body = ErrorResponse.of(code, request.getRequestURI(), null);
            objectMapper.writeValue(response.getWriter(), body);
        } catch (Exception ignore) {}

    }
}
