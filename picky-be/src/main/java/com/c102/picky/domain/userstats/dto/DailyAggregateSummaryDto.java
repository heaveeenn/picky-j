package com.c102.picky.domain.userstats.dto;

import com.c102.picky.domain.userstats.entity.DailyAggregateSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;

import static com.c102.picky.global.util.StatsFormatUtil.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DailyAggregateSummaryDto {
    private String activeHour;      // "14:00"
    private String avgBrowsingTime; // "01:23:00"
    private Double avgVisitCount;   // 18.5

    public static DailyAggregateSummaryDto from(DailyAggregateSummary entity) {
        return DailyAggregateSummaryDto.builder()
                .activeHour(formatHour(entity.getPeakHour()))
                .avgBrowsingTime(formatDuration(entity.getAvgBrowsingSeconds()))
                .avgVisitCount(entity.getAvgVisitCount())
                .build();
    }

}
