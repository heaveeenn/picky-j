package com.c102.picky.domain.recommendation.service;

import com.c102.picky.domain.content.service.ContentQueryService;
import com.c102.picky.domain.fact.entity.Fact;
import com.c102.picky.domain.fact.entity.FactView;
import com.c102.picky.domain.fact.repository.FactRepository;
import com.c102.picky.domain.fact.repository.FactViewRepository;
import com.c102.picky.domain.recommendation.dto.*;
import com.c102.picky.domain.recommendation.entity.UserRecommendationSlot;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.recommendation.model.SlotStatus;
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
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRecommendationSlotRepository slotRepository;
    private final FactRepository factRepository;
    private final FactViewRepository factViewRepository;

    private final ContentQueryService contentQueryService;
    private final UserSettingsService userSettingsService;

    @Override
    @Transactional
    public RecommendationPayloadResponseDto getNextRecommendation(Long userId, ContentType contentType, LocalDateTime windowStart, LocalDateTime windowEnd) {

        // 1) 윈도우 내에서 'SCHEDULED' 슬롯 1건을 락 걸고 집어온다 (경쟁 방지)
        var list = slotRepository.findTopForDeliveryWithLock(
                userId, contentType, windowStart, windowEnd, SlotStatus.SCHEDULED, PageRequest.of(0, 1));

        if (list.isEmpty()) return null;

        UserRecommendationSlot slot = list.get(0);

        // 2) 공통 응답 빌더 (타입별 contentId는 분기 안에서 넣는다)
        var builder = RecommendationPayloadResponseDto.builder()
                .slotId(slot.getId())
                .contentType(slot.getContentType())
                .slotAt(slot.getSlotAt());

        // 3) 타입별 페이로드 구성 & 딜리버리 처리
        switch (slot.getContentType()) {
            case NEWS -> {
                // NEWS: 슬롯에 이미 newsId가 있으니 바로 채운다
                builder.contentId(slot.getNewsId());
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
                // 딜리버리 완료 마킹(상태 = DELIVERED, 이벤트 기록)
                slot.setStatus(SlotStatus.DELIVERED);
            }
            case QUIZ -> {
                // QUIZ: 정답/해설 없이 문제만 노출
                builder.contentId(slot.getQuizId());
                var quiz = contentQueryService.getQuizPayload(slot.getQuizId(), false, false);
                builder
                        .question(quiz.getQuestion())
                        .extras(Map.of(
                                "title", quiz.getTitle(),
                                "url", quiz.getUrl(),
                                "rule", quiz.getRule()
                        ));
                // 딜리버리 완료 마킹
                slot.setStatus(SlotStatus.DELIVERED);
            }
            case FACT -> {
                // FACT: 슬롯에 factId가 '미리 바인딩'되어 있어야 한다
                Long factId = slot.getFactId();
                if (factId == null) {   // 방어: 없으면 뒤로 미룬다
                    pushBack(slot);
                    return null;
                }

                // 3-1) 팩트 존재 확인 (삭제/비활성 등으로 사라졌을 수 있음)
                var factOpt = factRepository.findById(factId);
                if (factOpt.isEmpty()) {    // 방어: 없으면 뒤로 미룬다
                    pushBack(slot);
                    return null;
                }

                // 3-2) '이미 본 팩트'인지 체크 -> 이미 봤다면 뒤로 미룬다
                if (factViewRepository.existsByUserIdAndFactId(userId, factId)) {
                    pushBack(slot);
                    return null;
                }

                // 3-3) 전달 가능: 페이로드 채우기
                var fact = factOpt.get();
                builder.contentId(fact.getId());
                builder.title(fact.getTitle());
                builder.extras(Map.of("content", fact.getContent(), "url", fact.getUrl()));

                // 3-4) 딜리버리 완료 마킹
                slot.setStatus(SlotStatus.DELIVERED);
            }
        }

        // 4) 최종 응답
        return builder.build();
    }

    @Override
    @Transactional
    public void acknowledgeRecommendation(Long userId, Long slotId, RecommendationAckRequestDto request) {
        // 1) 유저 소유의 슬롯인지 확인
        UserRecommendationSlot slot = slotRepository.findByIdAndUserId(slotId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.SLOT_NOT_FOUND));

        // 2) 이벤트 타입별 상태 전이 + (FACT일 때) 열람 기록
        // 상태 전이 : OPENED -> SEEN, DISMISS -> DISMISSED
        switch (request.getEventType()) {
            case OPENED -> {
                // UI가 실제로 팝업을 연 시점 -> 슬롯 상태를 SEEN으로
                slot.setStatus(SlotStatus.SEEN);

                // FACT는 'OPENED' 시점에만 봤다고 기록 (전달 시에는 기록 X)
                if (slot.getContentType() == ContentType.FACT) {
                    Long factId = slot.getFactId();
                    if (factId != null) {
                        // 중복 방지: 이미 기록돼 있으면 스킵
                        if (!factViewRepository.existsByUserIdAndFactId(userId, factId)) {
                            factViewRepository.save(
                                    FactView.builder()
                                            .userId(userId)
                                            .factId(factId)
                                            .viewAt(LocalDateTime.now())
                                            .build()
                            );
                        }
                    }
                }
            }
            case DISMISS -> slot.setStatus(SlotStatus.DISMISSED);
        }
    }

    @Override
    @Transactional
    public void upsertSlot(RecommendationUpsertRequestDto request) {

        // 1) 타입별 바인딩 무결성 체크
        boolean newsOk = request.getContentType() == ContentType.NEWS && request.getNewsId() != null && request.getQuizId() == null;
        boolean quizOk = request.getContentType() == ContentType.QUIZ && request.getQuizId() != null && request.getNewsId() == null;

        // FACT: newsId/quizId 없이 와야 함
        // factId가 비어서 오면 '업서트 시점'에 랜덤 바인딩
        boolean factOk = false;
        if (request.getContentType() == ContentType.FACT && request.getNewsId() == null && request.getQuizId() == null) {
            factOk = true;

            // 2) factId 미지정이면 '안 본 것 우선'으로 랜덤 픽 -> 없으면 전체 랜덤
            if (request.getFactId() == null) {
                var rnd = java.util.concurrent.ThreadLocalRandom.current();
                Long factId = factRepository.pickRandomUnseen(request.getUserId(), rnd)
                        .or(() -> factRepository.pickAny(rnd))
                        .map(Fact::getId)
                        .orElseThrow(() -> new ApiException(ErrorCode.RESOURCE_NOT_FOUND)); // 팩트가 0개
                request.setFactId(factId);  // 미리 바인딩 확정
            }
        }

        if (!(newsOk || quizOk || factOk)) {
            throw new ApiException(ErrorCode.INVALID_CONTENT_BINDING);
        }

        // 3) 사용자 설정 기반으로 '다음 슬롯 시간' 계산
        var userSettings = userSettingsService.findByUserId(request.getUserId());
        LocalDateTime nextSlotTime = calculateNextSlotTime(request.getUserId(), request.getContentType(), userSettings.getNotifyInterval());

        // 4) Unique(userId, ContentType, slotAt) 기반 업서트 : 조회 -> 있으면 갱신, 없으면 생성
        LocalDateTime start = nextSlotTime;
        LocalDateTime end = nextSlotTime;

        var existList = slotRepository.findTopForDeliveryWithLock(
                request.getUserId(), request.getContentType(), start, end, SlotStatus.SCHEDULED, PageRequest.of(0, 1)
        );

        if (existList.isEmpty()) {
            // 신규 생성
            slotRepository.save(UserRecommendationSlot.builder()
                    .userId(request.getUserId())
                    .contentType(request.getContentType())
                    .newsId(request.getNewsId())
                    .quizId(request.getQuizId())
                    .factId(request.getFactId())
                    .slotAt(nextSlotTime)
                    .priority(request.getPriority() == null ? 5 : request.getPriority())
                    .reason(request.getReason())
                    .status(SlotStatus.SCHEDULED)
                    .build());
        } else {
            // 동일 타임 슬롯 존재 -> 갱신
            UserRecommendationSlot s = existList.get(0);

            // 우선순위 더 높으면 교체
            if (request.getPriority() != null && request.getPriority() < s.getPriority()) {
                s.setPriority(request.getPriority());
            }
            s.setNewsId(request.getNewsId());
            s.setQuizId(request.getQuizId());
            s.setFactId(request.getFactId());
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

    /**
     * 이번 슬롯은 보류: 우선순위 + 1하고 상태를 다시 SCHEDULED로 (다음 기회로 미룸)
     */
    private void pushBack(UserRecommendationSlot slot) {
        slot.setPriority(slot.getPriority() + 1);
        slot.setStatus(SlotStatus.SCHEDULED);
    }
}
