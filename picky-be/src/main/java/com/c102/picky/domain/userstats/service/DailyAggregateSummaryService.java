package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.CategorySummaryDto;
import com.c102.picky.domain.userstats.dto.DailyAggregateSummaryDto;

import java.util.List;

public interface DailyAggregateSummaryService {
    DailyAggregateSummaryDto getYesterdaySummary();

    List<CategorySummaryDto> getCategorySummary();
}
