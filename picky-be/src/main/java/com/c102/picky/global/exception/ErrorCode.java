package com.c102.picky.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    USER_NOT_FOUND("USER_NOT_FOUND", HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    INVALID_PASSWORD("INVALID_PASSWORD", HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN("INVALID_TOKEN", HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    TOKEN_EXPIRED("TOKEN_EXPIRED", HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    VALIDATION_FAILED("VALIDATION_FAILED", HttpStatus.BAD_REQUEST, "입력값 검증에 실패했습니다."),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),
    ACCESS_DENIED("ACCESS_DENIED", HttpStatus.FORBIDDEN, "권한이 없습니다."),

    // Google OAuth2 관련 에러
    INVALID_GOOGLE_TOKEN("INVALID_GOOGLE_TOKEN", HttpStatus.UNAUTHORIZED, "유효하지 않은 구글 토큰입니다."),
    GOOGLE_TOKEN_VERIFICATION_FAILED("GOOGLE_TOKEN_VERIFICATION_FAILED", HttpStatus.UNAUTHORIZED, "구글 토큰 검증에 실패했습니다."),
    INVALID_REFRESH_TOKEN("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다."),

    // UserInterest 관련 에러
    CATEGORY_NOT_FOUND("CATEGORY_NOT_FOUND", HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다."),
    INVALID_CATEGORY_LEVEL("INVALID_CATEGORY_LEVEL", HttpStatus.BAD_REQUEST, "L1 카테고리만 등록할 수 있습니다."),
    USER_INTEREST_NOT_FOUND("USER_INTEREST_NOT_FOUND", HttpStatus.NOT_FOUND, "사용자 관심 카테고리를 찾을 수 없습니다."),

    // 권한 관련 에러
    UNAUTHORIZED("UNAUTHORIZED", HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다."),

    // Recommendation 관련 에러
    SLOT_NOT_FOUND("SLOT_NOT_FOUND", HttpStatus.NOT_FOUND, "추천 슬롯을 찾을 수 없습니다."),
    INVALID_CONTENT_BINDING("INVALID_CONTENT_BINDING", HttpStatus.BAD_REQUEST, "콘텐츠 타입과 ID 바인딩이 올바르지 않습니다."),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),

    // Content 관련 에러
    NEWS_NOT_FOUND("NEWS_NOT_FOUND", HttpStatus.NOT_FOUND, "뉴스를 찾을 수 없습니다."),
    QUIZ_NOT_FOUND("QUIZ_NOT_FOUND", HttpStatus.NOT_FOUND, "퀴즈를 찾을 수 없습니다."),

    // Scrap 관련 에러
    SCRAP_NOT_FOUND("SCRAP_NOT_FOUND", HttpStatus.NOT_FOUND, "스크랩을 찾을 수 없습니다."),
    ALREADY_SCRAPED("ALREADY_SCRAPED", HttpStatus.CONFLICT, "이미 스크랩된 콘텐츠입니다."),

    //
    SUMMARY_NOT_FOUND("SUMMARY_NOT_FOUND", HttpStatus.NOT_FOUND, "어제의 요약을 찾을 수 없습니다.");

    // 필요한 에러 코드 계속 추가


    private final String code;
    private final HttpStatus status;
    private final String message;
}
