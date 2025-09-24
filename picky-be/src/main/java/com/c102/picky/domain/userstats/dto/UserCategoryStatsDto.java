package com.c102.picky.domain.userstats.dto;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import lombok.Builder;
import lombok.Getter;

import static com.c102.picky.global.util.StatsFormatUtil.formatDuration;

@Getter
@Builder
public class UserCategoryStatsDto {
    private String categoryName;
    private Long visitCount;
    private String timeSpent;

    public static UserCategoryStatsDto fromEntity(UserCategoryStats entity) {
        return UserCategoryStatsDto.builder()
                .categoryName(entity.getCategory().getName())
                .visitCount(entity.getVisitCount())
                .timeSpent(formatDuration(entity.getTimeSpent()))
                .build();
    }
}
