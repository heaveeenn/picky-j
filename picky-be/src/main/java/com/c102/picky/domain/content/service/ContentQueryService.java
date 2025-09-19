package com.c102.picky.domain.content.service;

import com.c102.picky.domain.content.dto.NewsPayloadDto;
import com.c102.picky.domain.content.dto.QuizPayloadDto;

public interface ContentQueryService {

    /**
     * 뉴스 페이로드 조회
     */
    NewsPayloadDto getNewsPayload(Long newsId);

    /**
     * 퀴즈 페이로드 조회
     * @param includeAnswer OX 정답 포함 여부
     * @param includeExplanation 해설 포함 여부
     * @return
     */
    QuizPayloadDto getQuizPayload(Long quizId, boolean includeAnswer, boolean includeExplanation);
}
