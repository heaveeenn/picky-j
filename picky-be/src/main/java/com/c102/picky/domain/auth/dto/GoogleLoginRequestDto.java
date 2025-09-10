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

    /** Google One-Tap/IDP에서 받은 ID Token(JWT) */
    @NotBlank
    private String idToken;
}
