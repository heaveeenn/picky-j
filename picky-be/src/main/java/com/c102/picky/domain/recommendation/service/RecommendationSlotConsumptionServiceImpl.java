package com.c102.picky.domain.recommendation.service;

import com.c102.picky.domain.recommendation.model.SlotStatus;
import com.c102.picky.domain.recommendation.repository.UserRecommendationSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationSlotConsumptionServiceImpl implements RecommendationSlotConsumptionService {

    private final UserRecommendationSlotRepository userRecommendationSlotRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int consumeAsDelivered(Long userId, List<Long> slotIds) {
        if (slotIds == null || slotIds.isEmpty()) return 0;
        int updated = userRecommendationSlotRepository.bulkUpdateStatus(
                userId, slotIds, SlotStatus.SCHEDULED, SlotStatus.DELIVERED
        );
        log.debug("consumeAsDelivered userId={}, updatedRows={}, slotIds={}", userId, updated, slotIds);
        return updated;
    }
}
