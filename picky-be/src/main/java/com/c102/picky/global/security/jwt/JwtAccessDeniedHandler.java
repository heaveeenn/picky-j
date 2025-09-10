package com.c102.picky.global.security.jwt;

import com.c102.picky.global.exception.ErrorCode;
import com.c102.picky.global.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) {
        try {
            ErrorCode code = ErrorCode.INVALID_TOKEN;

            // 403은 ACCESS_DENIED
            code = ErrorCode.ACCESS_DENIED;

            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(code.getStatus().value());

            var body = ErrorResponse.of(code, request.getRequestURI(), null);
            objectMapper.writeValue(response.getWriter(), body);
        } catch (Exception ignore) {}
    }
}
