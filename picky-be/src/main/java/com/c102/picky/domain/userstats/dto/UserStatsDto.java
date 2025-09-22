package com.c102.picky.domain.userstats.dto;

import com.c102.picky.domain.userstats.entity.UserStats;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

import static com.c102.picky.global.util.StatsFormatUtil.formatDuration;

@Getter
@Builder
public class UserStatsDto {
    private Long totalSites;
    private String totalTimeSpent;
    private LocalDateTime lastUpdated;

    public static UserStatsDto fromEntity(UserStats entity) {
        return UserStatsDto.builder()
                .totalSites(entity.getTotalSites())
                .totalTimeSpent(formatDuration(entity.getTotalTimeSpent())) // 초 단위를 HH:mm:ss 변환
                .lastUpdated(entity.getLastUpdated())
                .build();
    }
}
