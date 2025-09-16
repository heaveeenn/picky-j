package com.c102.picky.global.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class CookieUtil {

    @Value("${app.cookie.name:refreshToken}")
    private String cookieName;

    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    @Value("${app.cookie.path:/}")
    private String cookiePath;

    @Value("${app.cookie.http-only:true}")
    private boolean cookieHttpOnly;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${app.cookie.max-age:209600}")
    private int cookieMaxAge;

    public void addCookie(HttpServletResponse response, String name, String value, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .path(cookiePath)
                .httpOnly(cookieHttpOnly)
                .secure(cookieSecure)  // 개발환경에서는 false
                .maxAge(maxAge);

        if(cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        // SameSite는 수동으로 붙이기
        String setCookie = builder.build() + "; SameSite=" + cookieSameSite;
        response.addHeader("Set-Cookie", setCookie);
        log.debug("Cookie added: {} = {}", name, value.substring(0, Math.min(10, value.length())) + "...");
    }

    public void deleteCookie(HttpServletResponse response, String name) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
                .path(cookiePath)
                .httpOnly(cookieHttpOnly)
                .secure(cookieSecure)  // 개발환경에서는 false
                .maxAge(0);

        if(cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        // SameSite는 수동으로 붙이기
        String setCookie = builder.build() + "; SameSite=" + cookieSameSite;
        response.addHeader("Set-Cookie", setCookie);
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
        addCookie(response, cookieName, refreshToken, Duration.ofSeconds(cookieMaxAge));
    }

    public void deleteRefreshTokenCookie(HttpServletResponse response) {

        deleteCookie(response, cookieName);
    }

    public Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        return getCookie(request, "refreshToken");
    }
}