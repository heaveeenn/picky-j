package com.c102.picky.domain.userstats.dto;
import com.c102.picky.domain.userstats.entity.UserHourlyStats;
import static com.c102.picky.global.util.StatsFormatUtil.formatDuration;
import static com.c102.picky.global.util.StatsFormatUtil.formatHour;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserHourlyStatsDto {
    private String hourLabel; // "00:00", "13:00" 형태로 변환해서 전달
    private String timeSpent;


    public static UserHourlyStatsDto fromEntity(UserHourlyStats entity) {
        return UserHourlyStatsDto.builder()
                .hourLabel(formatHour(entity.getHour()))
                .timeSpent(formatDuration(entity.getTimeSpent()))
                .build();
    }
}
