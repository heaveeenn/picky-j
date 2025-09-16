package com.c102.picky.global.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
public class CookieUtil {

    public void addCookie(HttpServletResponse response, String name, String value, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .maxAge(maxAge)
                .path("/")
                .httpOnly(true)
                .secure(false)  // 개발환경에서는 false
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
        log.debug("Cookie added: {} = {}", name, value.substring(0, Math.min(10, value.length())) + "...");
    }

    public void deleteCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .maxAge(0)
                .path("/")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
        log.debug("Cookie deleted: {}", name);
    }

    public Optional<String> getCookie(HttpServletRequest request, String name) {
        log.debug("Looking for cookie: {}", name);
        
        if (request.getCookies() == null) {
            log.debug("No cookies found in request");
            return Optional.empty();
        }
        
        log.debug("Found {} cookies in request", request.getCookies().length);
        for (Cookie cookie : request.getCookies()) {
            log.debug("Cookie: {} = {}", cookie.getName(), cookie.getValue().substring(0, Math.min(10, cookie.getValue().length())) + "...");
            if (name.equals(cookie.getName())) {
                log.debug("Found matching cookie: {}", name);
                return Optional.of(cookie.getValue());
            }
        }
        
        log.debug("Cookie '{}' not found", name);
        return Optional.empty();
    }

    public void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        addCookie(response, "refreshToken", refreshToken, Duration.ofDays(14));
    }

    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        deleteCookie(response, "refreshToken");
    }

    public Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        return getCookie(request, "refreshToken");
    }
}