package com.c102.picky.global.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private int status;
    private String message;
    private T data;
    private String timestamp;
    private String path;

    // 1) 생성 시각과 경로를 자동 채워 주는 편의 팩토리 메서드
    public static <T> ApiResponse<T> of(
            HttpStatus status,
            String message,
            T data,
            String requestPath
    ) {
        return new ApiResponse<>(
                true,
                status.value(),
                message,
                data,
                LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME),
                requestPath
        );
    }
}
