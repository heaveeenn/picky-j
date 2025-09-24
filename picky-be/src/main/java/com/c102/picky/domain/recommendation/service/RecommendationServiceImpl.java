package com.c102.picky.domain.recommendation.service;

import com.c102.picky.domain.content.service.ContentQueryService;
import com.c102.picky.domain.recommendation.dto.*;
import com.c102.picky.domain.recommendation.entity.UserRecommendationEvent;
import com.c102.picky.domain.recommendation.entity.UserRecommendationSlot;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.model.RecommendationEventType;
import com.c102.picky.domain.recommendation.model.SlotStatus;
import com.c102.picky.domain.recommendation.repository.UserRecommendationEventRepository;
import com.c102.picky.domain.recommendation.repository.UserRecommendationSlotRepository;
import com.c102.picky.domain.usersettings.service.UserSettingsService;
import com.c102.picky.global.dto.PageResponse;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRecommendationSlotRepository slotRepository;
    private final UserRecommendationEventRepository eventRepository;
    private final ContentQueryService contentQueryService;
    private final UserSettingsService userSettingsService;

    @Override
    @Transactional
    public RecommendationPayloadResponseDto getNextRecommendation(Long userId, ContentType contentType, LocalDateTime windowStart, LocalDateTime windowEnd) {
        var list = slotRepository.findTopForDeliveryWithLock(
                userId, contentType, windowStart, windowEnd, SlotStatus.SCHEDULED, PageRequest.of(0, 1));

        if (list.isEmpty()) return null;

        UserRecommendationSlot slot = list.get(0);
        slot.setStatus(SlotStatus.DELIEVERED);

        // 이벤트 로그
        eventRepository.save(UserRecommendationEvent.builder()
                .userId(userId)
                .slotId(slot.getId())
                .eventType(RecommendationEventType.DELIVERED)
                .build());


        var builder = RecommendationPayloadResponseDto.builder()
                .slotId(slot.getId())
                .contentType(slot.getContentType())
                .contentId(slot.getContentId())
                .slotAt(slot.getSlotAt());

        // 최초 팝업은 정답/해설 미포함
        switch (slot.getContentType()) {
            case NEWS -> {
                var news = contentQueryService.getNewsPayload(slot.getNewsId());
                builder
                        .title(news.getTitle())
                        .url(news.getUrl());
                builder.extras(Map.of(
                        "summary", news.getSummary(),
                        "published_at", news.getPublishedAt(),
                        "categoryId", news.getCategoryId(),
                        "categoryName", news.getCategoryName()
                ));
            }
            case QUIZ -> {
                var quiz = contentQueryService.getQuizPayload(slot.getQuizId(), false, false);
                builder
                        .question(quiz.getQuestion())
                        .extras(Map.of(
                                "title", quiz.getTitle(),
                                "url", quiz.getUrl(),
                                "rule", quiz.getRule()
                        ));
            }
        }
        return builder.build();
    }

    @Override
    @Transactional
    public void acknowledgeRecommendation(Long userId, Long slotId, RecommendationAckRequestDto request) {
        UserRecommendationSlot slot = slotRepository.findByIdAndUserId(slotId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.SLOT_NOT_FOUND));

        // 상태 전이 : OPENED -> SEEN, DISMISS -> DISMISSED
        switch (request.getEventType()) {
            case OPENED -> slot.setStatus(SlotStatus.SEEN);
            case DISMISS -> slot.setStatus(SlotStatus.DISMISSED);
        }

        eventRepository.save(UserRecommendationEvent.builder()
                .userId(userId)
                .slotId(slotId)
                .eventType(request.getEventType())
                .dwellMs(Optional.ofNullable(request.getDwellMs()).orElse(0))
                .build());
    }

    @Override
    @Transactional
    public void upsertSlot(RecommendationUpsertRequestDto request) {

        // 무결성 검증: 타입에 따라 newsId/quizId 정확히 하나만
        boolean newsOk = request.getContentType() == ContentType.NEWS && request.getNewsId() != null && request.getQuizId() == null;
        boolean quizOk = request.getContentType() == ContentType.QUIZ && request.getQuizId() != null && request.getNewsId() == null;
        if (!(newsOk || quizOk)) {
            throw new ApiException(ErrorCode.INVALID_CONTENT_BINDING);
        }

        // 사용자 설정 기반으로 다음 알림 시간 계산
        var userSettings = userSettingsService.findByUserId(request.getUserId());
        LocalDateTime nextSlotTime = calculateNextSlotTime(request.getUserId(), request.getContentType(), userSettings.getNotifyInterval());

        // Unique(userId, ContentType, slotAt) 기반 업서트 : 조회 -> 있으면 갱신, 없으면 생성
        LocalDateTime start = nextSlotTime;
        LocalDateTime end = nextSlotTime;

        var existList = slotRepository.findTopForDeliveryWithLock(
                request.getUserId(), request.getContentType(), start, end, SlotStatus.SCHEDULED, PageRequest.of(0, 1)
        );

        if (existList.isEmpty()) {
            slotRepository.save(UserRecommendationSlot.builder()
                    .userId(request.getUserId())
                    .contentType(request.getContentType())
                    .newsId(request.getNewsId())
                    .quizId(request.getQuizId())
                    .slotAt(nextSlotTime)
                    .priority(request.getPriority() == null ? 5 : request.getPriority())
                    .reason(request.getReason())
                    .status(SlotStatus.SCHEDULED)
                    .build());
        } else {
            UserRecommendationSlot s = existList.get(0);

            // 우선순위 더 높으면 교체
            if (request.getPriority() != null && request.getPriority() < s.getPriority()) {
                s.setPriority(request.getPriority());
            }
            s.setNewsId(request.getNewsId());
            s.setQuizId(request.getQuizId());
            s.setReason(request.getReason());
        }
    }

    /**
     * 개인화 뉴스 피드 조회
     * <p>
     * 흐름:
     * 1) 입력 검증(인증/파라미터) -> 실패 시 ApiException 던짐
     * 2) 정렬 모드 -> Sort 스펙 변환
     * 3) Pageable 구성 -> Repository 호출(JPQL DTO 프로젝션 + countQuery)
     * 4) Page<T> -> 공통 PageResponse<T> 변환 후 반환
     * <p>
     * 예외는 GlobalExceptionHandler가 받아서 ErrorResponse로 반환
     */
    @Transactional(readOnly = true)
    @Override
    public PageResponse<NewsFeedItemDto> getNewsFeed(
            Long userId, Integer page, Integer size, FeedSort sortMode, LocalDateTime from, LocalDateTime to) {

        // 1) 입력 검증
        if (userId == null) throw new ApiException(ErrorCode.UNAUTHORIZED);
        if (from != null && to != null && !from.isBefore(to)) throw new ApiException(ErrorCode.VALIDATION_FAILED);

        int p = Optional.ofNullable(page).orElse(0);
        int s = Optional.ofNullable(size).orElse(10);

        if (p < 0 || s <= 0 || s > MAX_PAGE_SIZE) {   // size 상한(100)으로 과도한 요청 방지
            throw new ApiException(ErrorCode.VALIDATION_FAILED);
        }

        // 2) 정렬 모드 -> Sort
        FeedSort mode = Optional.ofNullable(sortMode).orElse(FeedSort.MIXED);
        Sort sortSpec = switch (mode) {
            case LATEST -> Sort.by(Sort.Order.desc("slotAt"), Sort.Order.desc("id"));
            case PRIORITY -> Sort.by(Sort.Order.asc("priority"), Sort.Order.desc("slotAt"), Sort.Order.desc("id"));
            case MIXED -> Sort.by(Sort.Order.desc("slotAt"), Sort.Order.asc("priority"), Sort.Order.desc("id"));
        };

        // 3) Pageable 구성 & Repository 호출
        Pageable pageable = PageRequest.of(p, s, sortSpec);
        var pageResult = slotRepository.findNewsFeed(userId, from, to, pageable);

        // 4) 공통 페이지 응답으로 변환
        return PageResponse.from(pageResult);
    }

    /**
     * 사용자 설정을 기반으로 다음 알림 시간을 계산
     */
    private LocalDateTime calculateNextSlotTime(Long userId, ContentType contentType, int notifyIntervalMinutes) {
        // 사용자의 마지막 알림 시간 조회
        var lastSlot = slotRepository.findTopByUserIdAndContentTypeOrderBySlotAtDesc(userId, contentType);

        LocalDateTime baseTime;
        if (lastSlot.isPresent()) {
            // 마지막 알림 시간에서 interval만큼 더함
            baseTime = lastSlot.get().getSlotAt().plusMinutes(notifyIntervalMinutes);
        } else {
            // 첫 번째 알림이면 현재 시간에서 interval만큼 더함
            baseTime = LocalDateTime.now().plusMinutes(notifyIntervalMinutes);
        }

        return baseTime;
    }

//    @Override
//    @Transactional(readOnly = true)
//    public List<RecommendationPayloadResponseDto> getScheduledRecommendations(Long userId, ContentType contentType) {
//        List<UserRecommendationSlot> slots = slotRepository.findByUserIdAndStatusAndContentTypeOrderBySlotAtAsc(
//                userId, SlotStatus.SCHEDULED, contentType);
//
//        return slots.stream()
//                .map(this::buildRecommendationPayload)
//                .toList();
//    }

    private RecommendationPayloadResponseDto buildRecommendationPayload(UserRecommendationSlot slot) {
        var builder = RecommendationPayloadResponseDto.builder()
                .slotId(slot.getId())
                .contentType(slot.getContentType())
                .contentId(slot.getContentId())
                .slotAt(slot.getSlotAt());

        switch (slot.getContentType()) {
            case NEWS -> {
                var news = contentQueryService.getNewsPayload(slot.getNewsId());
                builder
                        .title(news.getTitle())
                        .url(news.getUrl());
                builder.extras(Map.of(
                        "summary", news.getSummary(),
                        "published_at", news.getPublishedAt(),
                        "categoryId", news.getCategoryId(),
                        "categoryName", news.getCategoryName()
                ));
            }
            case QUIZ -> {
                var quiz = contentQueryService.getQuizPayload(slot.getQuizId(), false, false);
                builder
                        .question(quiz.getQuestion())
                        .extras(Map.of(
                                "title", quiz.getTitle(),
                                "url", quiz.getUrl(),
                                "rule", quiz.getRule()
                        ));
            }
        }
        return builder.build();
    }
}
