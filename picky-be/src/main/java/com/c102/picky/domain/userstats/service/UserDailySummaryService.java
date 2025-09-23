package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserVsAverageDto;

import java.time.LocalDate;

public interface UserDailySummaryService {
    UserVsAverageDto getUserVsAverage(Long id);
}
