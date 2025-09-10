package com.c102.picky.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 리프레시 토큰 재발급 요청 DTO
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@ToString
public class RefreshTokenRequestDto {

    /** 클라이언트가 보유 중인 리프레시 토큰 */
    @NotBlank
    private String refreshToken;
}
