package com.c102.picky.domain.quiz.service;

import com.c102.picky.domain.quiz.dto.QuizListItemDto;
import com.c102.picky.global.dto.PageResponse;

public interface QuizService {

    PageResponse<QuizListItemDto> getQuizPage(Long userId, Integer page, Integer size);
}
