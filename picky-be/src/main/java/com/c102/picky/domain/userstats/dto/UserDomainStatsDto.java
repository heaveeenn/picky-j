package com.c102.picky.domain.userstats.dto;

import com.c102.picky.domain.userstats.entity.UserDomainStats;
import static com.c102.picky.global.util.StatsFormatUtil.formatDuration;
import lombok.Builder;
import lombok.Getter;

import java.util.Locale;

@Getter
@Builder
public class UserDomainStatsDto {
    private String domain;
    private Long visitCount;
    private String timeSpent;

    public static UserDomainStatsDto fromEntity(UserDomainStats entity) {
        return UserDomainStatsDto.builder()
                .domain(normalizeDomain(entity.getDomain()))
                .visitCount(entity.getVisitCount())
                .timeSpent(formatDuration(entity.getTimeSpent()))
                .build();
    }

    private static String normalizeDomain(String d) {
        if (d == null) return "";
        d = d.trim().toLowerCase(Locale.ROOT);

        // 프로토콜 제거
        if (d.startsWith("http://")) d = d.substring(7);
        if (d.startsWith("https://")) d = d.substring(8);

        // www. prefix 제거
        if (d.startsWith("www.")) d = d.substring(4);

        // 앞뒤 점/슬래시 정리
        while (d.startsWith(".")) d = d.substring(1);
        if (d.endsWith("/")) d = d.substring(0, d.length() - 1);

        return d;
    }

}
