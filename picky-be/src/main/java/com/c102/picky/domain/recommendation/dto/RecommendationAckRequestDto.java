package com.c102.picky.domain.recommendation.dto;

import com.c102.picky.domain.recommendation.model.RecommendationEventType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecommendationAckRequestDto {
    @NotNull
    private RecommendationEventType eventType;
    @Min(0) @Builder.Default
    private Integer dwellMs = 0;
}
