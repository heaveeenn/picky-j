package com.c102.picky.global.util;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    @Value("${app.refresh-cookie.name:refreshToken}")
    private String name;

    @Value("${app.refresh-cookie.path:/}")
    private String path;

    @Value("${app.refresh-cookie.http-only:true}")
    private boolean httpOnly;

    @Value("${app.refresh-cookie.same-site:Lax}")
    private String sameSite;

    @Value("${app.refresh-cookie.secure:false}")
    private boolean secure;

    @Value("${app.refresh-cookie.domain:}")
    private String domain;

    @Value("${app.refresh-cookie.max-age-days:7}")
    private int maxAgeDays;

    public void addRefreshTokenCookie(HttpServletResponse response, String token) {
        addRefreshTokenCookie(response, token, Duration.ofDays(maxAgeDays));
    }


    public void addRefreshTokenCookie(HttpServletResponse response, String token, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, token)
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(maxAge);

        Optional.ofNullable(emptyToNull(domain)).ifPresent(builder::domain);
        response.addHeader("Set-Cookie", builder.build().toString());
    }

    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(0);

        Optional.ofNullable(emptyToNull(domain)).ifPresent(builder::domain);
        response.addHeader("Set-Cookie", builder.build().toString());
    }

    public static jakarta.servlet.http.Cookie createSecureCookie(String name, String value, int maxAge) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(maxAge);
        return cookie;
    }

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

}
