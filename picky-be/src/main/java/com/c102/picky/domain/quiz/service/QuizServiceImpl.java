package com.c102.picky.domain.quiz.service;

import com.c102.picky.domain.quiz.dto.QuizListItemDto;
import com.c102.picky.domain.quiz.entity.Quiz;
import com.c102.picky.domain.quiz.repository.QuizAttemptRepository;
import com.c102.picky.domain.quiz.repository.QuizRepository;
import com.c102.picky.domain.recommendation.entity.UserRecommendationSlot;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.repository.UserRecommendationSlotRepository;
import com.c102.picky.domain.scrap.repository.UserScrapRepository;
import com.c102.picky.global.dto.PageResponse;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final int MAX_PAGE_SIZE = 20;

    private final UserRecommendationSlotRepository userRecommendationSlotRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserScrapRepository userScrapRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QuizListItemDto> getQuizPage(Long userId, Integer page, Integer size) {
        // 0) 기본 검증
        if (userId == null) throw new ApiException(ErrorCode.UNAUTHORIZED);

        int p = (page == null || page < 0) ? 0 : page;
        int s = (size == null || size <= 0) ? 5 : Math.min(size, MAX_PAGE_SIZE);

        // 1) 추천 슬롯 페이지 조회 (정렬은 JPQL 쿼리의 ORDER BY를 따름)
        Pageable pageable = PageRequest.of(p, s);
        Page<UserRecommendationSlot> slotPage = userRecommendationSlotRepository.findQuizSlotsForWindow(userId, pageable);

        // 빈 페이지 반환
        if (slotPage.isEmpty()) return PageResponse.from(Page.empty(pageable));

        // 2) 슬롯 -> 퀴즈 ID 수집
        List<Long> quizIds = slotPage.getContent().stream()
                .map(UserRecommendationSlot::getQuizId)
                .filter(Objects::nonNull)
                .toList();

        // 3) 퀴즈 본문 배치 로드 (Map)
        Map<Long, Quiz> quizMap = quizRepository.findAllById(quizIds).stream()
                .collect(Collectors.toMap(Quiz::getId, Function.identity()));

        // 4) 스크랩/시도 상태 배치 로드 (Set)
        Set<Long> scrappedIds = quizIds.isEmpty()
                ? Set.of() : userScrapRepository.findActiveScrappedQuizIds(userId, ContentType.QUIZ, quizIds);

        Set<Long> attemptedIds = quizIds.isEmpty()
                ? Set.of() : quizAttemptRepository.findAttemptedQuizIds(userId, quizIds);

        // 5) DTO 매핑 (order는 페이지 내 1...size)
        AtomicInteger order = new AtomicInteger(1);
        List<QuizListItemDto> items = new ArrayList<>(slotPage.getNumberOfElements());

        for (UserRecommendationSlot slot : slotPage.getContent()) {
            Quiz q = quizMap.get(slot.getQuizId());
            if (q == null) continue;

            items.add(QuizListItemDto.builder()
                    .slotId(slot.getId())
                    .quizId(q.getId())
                    .title(q.getTitle())
                    .question(q.getQuestion())
                    .url(q.getUrl())
                    .rule(q.getRule())
                    .isScrapped(scrappedIds.contains(q.getId()))
                    .isAttempted(attemptedIds.contains(q.getId()))
                    .order(order.getAndIncrement())
                    .build());
        }

        // 6) Page<DTO>로 감싸서 PageResponse 반환
        Page<QuizListItemDto> dtoPage = new PageImpl<>(items, pageable, slotPage.getTotalElements());

        return PageResponse.from(dtoPage);
    }
}
