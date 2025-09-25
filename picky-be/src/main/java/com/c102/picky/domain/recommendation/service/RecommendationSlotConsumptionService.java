package com.c102.picky.domain.recommendation.service;

import java.util.List;

public interface RecommendationSlotConsumptionService {

    int consumeAsDelivered(Long userId, List<Long> slotIds);
}
