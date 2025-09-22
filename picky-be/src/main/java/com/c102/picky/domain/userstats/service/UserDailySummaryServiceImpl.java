package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserVsAverageDto;
import com.c102.picky.domain.userstats.entity.DailyAggregateSummary;
import com.c102.picky.domain.userstats.entity.UserDailySummary;
import com.c102.picky.domain.userstats.repository.DailyAggregateSummaryRepository;
import com.c102.picky.domain.userstats.repository.UserDailySummaryRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@AllArgsConstructor
public class UserDailySummaryServiceImpl implements UserDailySummaryService{
    private final DailyAggregateSummaryRepository dailyAggregateSummaryRepository;
    private final UserDailySummaryRepository userDailySummaryRepository;

    @Transactional(readOnly = true)
    public UserVsAverageDto getUserVsAverage(Long userId) {
        //LocalDate date = LocalDate.now().minusDays(1); // 운영
        LocalDate date = LocalDate.now(); // 테스트

        // 1. 평균값 불러오기
        DailyAggregateSummary avgSummary = dailyAggregateSummaryRepository.findBySummaryDate(date)
                .orElseThrow(() -> new ApiException(ErrorCode.SUMMARY_NOT_FOUND));

        // 2. 사용자 값 불러오기
        UserDailySummary userSummary = userDailySummaryRepository.findByUserIdAndSummaryDate(userId, date)
                .orElseThrow(() -> new ApiException(ErrorCode.SUMMARY_NOT_FOUND));

        // 3. 퍼센트 차이 계산
        String timeDiff = formatDiff(userSummary.getTotalTimeSpent(), avgSummary.getAvgBrowsingSeconds());
        String visitDiff = formatDiff(userSummary.getTotalSites(), avgSummary.getAvgVisitCount());

        return UserVsAverageDto.builder()
                .browsingTimeDiff(timeDiff)
                .visitCountDiff(visitDiff)
                .build();
    }

    private String formatDiff(double userValue, double avgValue) {
        if (avgValue == 0) return "데이터 없음";
        double ratio = ((userValue - avgValue) / avgValue) * 100;
        if (ratio > 0) {
            return String.format("평균보다 %.0f%% 많음", ratio);
        } else if (ratio < 0) {
            return String.format("평균보다 %.0f%% 적음", Math.abs(ratio));
        } else {
            return "평균과 동일";
        }
    }
}
