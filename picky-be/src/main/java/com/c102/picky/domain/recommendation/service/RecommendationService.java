package com.c102.picky.domain.recommendation.service;

import com.c102.picky.domain.recommendation.dto.*;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.global.dto.PageResponse;

import java.time.LocalDateTime;

public interface RecommendationService {
    RecommendationPayloadResponseDto getNextRecommendation(Long userId, ContentType contentType, LocalDateTime windowStart, LocalDateTime windowEnd);

    void acknowledgeRecommendation(Long userId, Long slotId, RecommendationAckRequestDto request);

    void upsertSlot(RecommendationUpsertRequestDto request);

    PageResponse<NewsFeedItemDto> getNewsFeed(Long userId, Integer page, Integer size, FeedSort sortMode, LocalDateTime from, LocalDateTime to);
}
