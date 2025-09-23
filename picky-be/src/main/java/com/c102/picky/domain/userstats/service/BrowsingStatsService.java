package com.c102.picky.domain.userstats.service;


import java.time.LocalDate;
import java.time.LocalDateTime;

public interface BrowsingStatsService {
    void aggregateAndSave(LocalDateTime oneHourAgo, LocalDateTime now);

    void aggregateDailySummary(LocalDate yesterday);
}
