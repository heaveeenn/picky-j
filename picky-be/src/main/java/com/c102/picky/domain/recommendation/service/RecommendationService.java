package com.c102.picky.domain.recommendation.service;

import com.c102.picky.domain.recommendation.dto.RecommendationAckRequestDto;
import com.c102.picky.domain.recommendation.dto.RecommendationPayloadResponseDto;
import com.c102.picky.domain.recommendation.dto.RecommendationUpsertRequestDto;
import com.c102.picky.domain.recommendation.model.ContentType;

import java.time.LocalDateTime;

public interface RecommendationService {
    RecommendationPayloadResponseDto getNextRecommendation(Long userId, ContentType contentType, LocalDateTime windowStart, LocalDateTime windowEnd);

    void acknowledgeRecommendation(Long userId, Long slotId, RecommendationAckRequestDto request);

    void upsertSlot(RecommendationUpsertRequestDto request);
}
