package com.c102.picky.domain.recommendation.dto;

import com.c102.picky.domain.recommendation.model.ContentType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecommendationUpsertRequestDto {
    @NotNull private Long userId;
    @NotNull private ContentType contentType;
    private Long newsId;
    private Long quizId;
    @NotNull private LocalDateTime slotAt;
    @Min(1) @Max(10) @Builder.Default private Integer priority = 5;
    private String reason;
}
