package com.c102.picky.domain.content.service;

import com.c102.picky.domain.content.dto.NewsPayloadDto;
import com.c102.picky.domain.content.dto.QuizPayloadDto;
import com.c102.picky.domain.news.entity.News;
import com.c102.picky.domain.news.repository.NewsRepository;
import com.c102.picky.domain.quiz.entity.Quiz;
import com.c102.picky.domain.quiz.repository.QuizRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ContentQueryServiceImpl implements ContentQueryService {

    private final NewsRepository newsRepository;
    private final QuizRepository quizRepository;

    /**
     * 뉴스 페이로드 조회
     *
     * @param newsId
     */
    @Override
    public NewsPayloadDto getNewsPayload(Long newsId) {
        News n = newsRepository.findWithCategoryById(newsId)
                .orElseThrow(() -> new ApiException(ErrorCode.NEWS_NOT_FOUND));

        return NewsPayloadDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .url(n.getUrl())
                .summary(n.getSummary())
                .publishedAt(n.getPublishedAt())
                .categoryId(n.getCategory() != null ? n.getCategory().getId() : null)
                .categoryName(n.getCategory() != null ? n.getCategory().getName() : null)
                .build();
    }

    /**
     * 퀴즈 페이로드 조회
     *
     * @param quizId
     * @param includeAnswer      OX 정답 포함 여부
     * @param includeExplanation 해설 포함 여부
     * @return
     */
    @Override
    public QuizPayloadDto getQuizPayload(Long quizId, boolean includeAnswer, boolean includeExplanation) {
        Quiz q = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException(ErrorCode.QUIZ_NOT_FOUND));

        return QuizPayloadDto.builder()
                .id(q.getId())
                .title(q.getTitle())
                .question(q.getQuestion())
                .url(q.getUrl())
                .rule(q.getRule())
                .explanation(includeExplanation ? q.getExplanation() : null)
                .answer(includeAnswer ? q.isAnswer() : null)
                .build();
    }
}
