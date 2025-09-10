package com.c102.picky.global.exception;

import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ErrorResponse {
    private boolean success;           // 항상 false
    private String errorCode;          // ErrorCode.code
    private String message;            // 상세 메시지
    private List<FieldError> details;  // (옵션) 필드 검증 오류
    private String timestamp;          // ISO 8601 포맷
    private String path;               // 요청 URI

    @Getter
    @AllArgsConstructor
    public static class FieldError {
        private String field;
        private String rejectedValue;
        private String reason;
    }

    public static ErrorResponse of(ErrorCode errorCode, String path, List<FieldError> details) {
        return ErrorResponse.builder()
                .success(false)
                .errorCode(errorCode.getCode())
                .message(errorCode.getMessage())
                .details(details)
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .path(path)
                .build();
    }
}
