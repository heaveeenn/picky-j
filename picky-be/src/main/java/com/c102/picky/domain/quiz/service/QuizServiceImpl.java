package com.c102.picky.domain.quiz.service;

import com.c102.picky.domain.quiz.dto.QuizListItemDto;
import com.c102.picky.domain.quiz.entity.Quiz;
import com.c102.picky.domain.quiz.repository.QuizAttemptRepository;
import com.c102.picky.domain.quiz.repository.QuizRepository;
import com.c102.picky.domain.recommendation.entity.UserRecommendationSlot;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.repository.UserRecommendationSlotRepository;
import com.c102.picky.domain.recommendation.service.RecommendationSlotConsumptionService;
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

    private final RecommendationSlotConsumptionService recommendationSlotConsumptionService;

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

        Set<Long> scrappedIds = quizIds.isEmpty()
                ? Set.of() : userScrapRepository.findActiveScrappedQuizIds(userId, ContentType.QUIZ, quizIds);

        Set<Long> attemptedIds = quizIds.isEmpty()
                ? Set.of() : quizAttemptRepository.findAttemptedQuizIds(userId, quizIds);

        // 4) 미시도 우선 + 중복 제거 + 5개 채우기
        final int target = s;
        AtomicInteger order = new AtomicInteger(1);
        List<QuizListItemDto> items = new ArrayList<>(target);
        Set<Long> seenQuiz = new HashSet<>();

        // 4-1) 미시도만 먼저 담기
        for (UserRecommendationSlot slot : slotPage.getContent()) {
            Long quizId = slot.getQuizId();
            if (quizId == null) continue;
            if (seenQuiz.contains(quizId)) continue;
            if (attemptedIds.contains(quizId)) continue;

            Quiz q = quizMap.get(quizId);
            if (q == null) continue;

            items.add(toDto(slot, q, scrappedIds, attemptedIds, order.getAndIncrement()));
            seenQuiz.add(quizId);
            if (items.size() == target) break;
        }

        // 4-2) 부족하면 ‘시도한 것’에서 중복 없이 백필
        if (items.size() < target) {
            for (UserRecommendationSlot slot : slotPage.getContent()) {
                Long qid = slot.getQuizId();
                if (qid == null) continue;
                if (seenQuiz.contains(qid)) continue;

                Quiz q = quizMap.get(qid);
                if (q == null) continue;

                items.add(toDto(slot, q, scrappedIds, attemptedIds, order.getAndIncrement()));
                seenQuiz.add(qid);
                if (items.size() == target) break;
            }
        }

        List<Long> deliveredSlotIds = items.stream()
                .map(QuizListItemDto::getSlotId)
                .filter(Objects::nonNull)
                .toList();

        if (!deliveredSlotIds.isEmpty()) {
            recommendationSlotConsumptionService.consumeAsDelivered(userId, deliveredSlotIds);
        }

        // 5) Page 래핑 (total은 slotPage 기준 유지)
        Page<QuizListItemDto> dtoPage = new PageImpl<>(items, pageable, slotPage.getTotalElements());
        return PageResponse.from(dtoPage);
    }

    private QuizListItemDto toDto(UserRecommendationSlot slot, Quiz q,
                                  Set<Long> scrappedIds, Set<Long> attemptedIds, int order) {
        return QuizListItemDto.builder()
                .slotId(slot.getId())
                .quizId(q.getId())
                .title(q.getTitle())
                .question(q.getQuestion())
                .url(q.getUrl())
                .rule(q.getRule())
                .isScrapped(scrappedIds.contains(q.getId()))
                .isAttempted(attemptedIds.contains(q.getId()))
                .order(order)
                .build();
    }
}
