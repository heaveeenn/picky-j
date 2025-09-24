package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.DailyAggregateSummaryDto;

public interface DailyAggregateSummaryService {
    DailyAggregateSummaryDto getYesterdaySummary();
}
