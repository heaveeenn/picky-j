package com.c102.picky.domain.userstats.dto;

import com.c102.picky.domain.userstats.entity.UserDomainStats;
import static com.c102.picky.global.util.StatsFormatUtil.formatDuration;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserDomainStatsDto {
    private String domain;
    private Long visitCount;
    private String timeSpent;

    public static UserDomainStatsDto fromEntity(UserDomainStats entity) {
        return UserDomainStatsDto.builder()
                .domain(entity.getDomain())
                .visitCount(entity.getVisitCount())
                .timeSpent(formatDuration(entity.getTimeSpent()))
                .build();
    }
}
