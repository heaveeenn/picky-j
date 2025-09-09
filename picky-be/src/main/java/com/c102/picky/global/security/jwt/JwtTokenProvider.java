package com.c102.picky.global.security.jwt;

import com.c102.picky.domain.auth.dto.TokenResponseDto;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import com.google.common.net.HttpHeaders;
import com.nimbusds.oauth2.sdk.TokenResponse;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;


@Component
public class JwtTokenProvider {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLE_KEY = "role";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.issuer:picky}")
    private String issuer;

    @Value("${jwt.access-token-validity-seconds}")
    private long accessValidSeconds;

    @Value("${jwt.refresh-token-validity-seconds}")
    private long refreshValidSeconds;

    private SecretKey secretKey;


    @PostConstruct
    public void init() {
        // secret이 Base64가 아니라 plain 텍스트인 경우에도 안전하게 처리
        byte[] keyBytes = isBase64(secret)
                ? Base64.getDecoder().decode(secret)
                : secret.getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private boolean isBase64(String secret) {
        try {
            Base64.getDecoder().decode(secret);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public String createAccessToken(String googleSub, String role) {
        return createToken(googleSub, role, accessValidSeconds);
    }

    public String createRefreshToken(String googleSub) {
        return createToken(googleSub, null, refreshValidSeconds);
    }

    public TokenResponseDto createTokenResponse(String googleSub, String role) {
        String access = createAccessToken(googleSub, role);
        String refresh = createRefreshToken(googleSub);
        return TokenResponseDto.of(access, refresh);
    }

    private String createToken(String googleSub, String role, long validSeconds) {
        Instant now = Instant.now();
        JwtBuilder jwtBuilder = Jwts.builder()
                .setSubject(googleSub)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(validSeconds)))
                .signWith(secretKey, SignatureAlgorithm.HS256);

        if(role != null) {
            jwtBuilder.claim(ROLE_KEY, role);
        }
        return jwtBuilder.compact();
    }

    // 파싱 / 검증 / 추출
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token).getBody();
    }

    /** subject(=googleSub) */
    public String getSubject(String token) {
        return parseClaims(token).getSubject();
    }

    /** role 클레임 (없으면 null) */
    public String getRole(String token) {
        Object v = parseClaims(token).get(ROLE_KEY);
        return v==null?null:v.toString();
    }

    /** Authorization: Bearer xxx 에서 토큰만 꺼내기 */
    public Optional<String> resolve(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if(header != null && header.startsWith(BEARER_PREFIX)) {
            return Optional.of(header.substring(BEARER_PREFIX.length()).trim());
        }
        return Optional.empty();
    }
}
