package com.c102.picky.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 구글 로그인 요청 DTO
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@ToString
public class GoogleLoginRequestDto {

    /** Google ID Token (웹 애플리케이션에서 사용) */
    private String idToken;

    /** Google Access Token (Chrome 확장프로그램에서 사용) */
    private String accessToken;

    /** 요청 출처 (optional) */
    private String source;

    /** Chrome 확장프로그램에서 전달하는 사용자 정보 (optional) */
    private Object userInfo;

    /** 실제 토큰 값 반환 (idToken 또는 accessToken 중 존재하는 것) */
    public String getToken() {
        if (accessToken != null && !accessToken.isEmpty()) {
            return accessToken;
        }
        return idToken;
    }
}
