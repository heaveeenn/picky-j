package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.DailyAggregateSummaryDto;
import com.c102.picky.domain.userstats.entity.DailyAggregateSummary;
import com.c102.picky.domain.userstats.repository.DailyAggregateSummaryRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DailyAggregateSummaryServiceImpl implements DailyAggregateSummaryService{
    private final DailyAggregateSummaryRepository dailyAggregateSummaryRepository;

    @Transactional(readOnly = true)
    public DailyAggregateSummaryDto getYesterdaySummary() {
        LocalDate yesterday = LocalDate.now().minusDays(1); // 운영
        // LocalDate yesterday = LocalDate.now(); // 테스트
        DailyAggregateSummary summary = dailyAggregateSummaryRepository.findBySummaryDate(yesterday)
                .orElseThrow(() -> new ApiException(ErrorCode.SUMMARY_NOT_FOUND));
        return DailyAggregateSummaryDto.from(summary);
    }
}
