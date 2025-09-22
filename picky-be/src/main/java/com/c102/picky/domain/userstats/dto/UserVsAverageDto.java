package com.c102.picky.domain.userstats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserVsAverageDto {
    private String browsingTimeDiff;  // "평균보다 15% 많음"
    private String visitCountDiff;    // "평균보다 12% 적음"
}
