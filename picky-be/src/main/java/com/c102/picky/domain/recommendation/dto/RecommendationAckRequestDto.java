package com.c102.picky.domain.recommendation.dto;

import com.c102.picky.domain.recommendation.model.RecommendationEventType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationAckRequestDto {

    @NotNull
    private Long slotId;

    @NotNull
    private RecommendationEventType eventType;
}
