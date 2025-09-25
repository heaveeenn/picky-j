package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.repository.UserHourlyStatsRepository;
import com.c102.picky.domain.userstats.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
/**
 * mongo db를 한 시간 주기로 돌면서 MySQL에 저장합니다.
 * 매 정각마다 실행 하며 이전 1시간까지의 내용을 저장합니다.(예: 13:00 -> 12:00 ~ 13:00 데이터 집계)
 */
public class BrowsingStatsScheduler {
    private final BrowsingStatsService statsService;
    private final UserHourlyStatsRepository userHourlyStatsRepository;
    private final UserStatsRepository userStatsRepository;

    /**
     * 매일 자정에 통계 테이블 초기화
     */
//    @Scheduled(cron = "0 45 9 * * *")
    @Scheduled(cron = "0 30 0 * * *") // 매일 00:30 실행
    @Transactional
    public void resetDailyStats() {
        log.info("==== 사용자 통계 테이블 초기화 시작 ====");

        userHourlyStatsRepository.deleteAllInBatch();
        userStatsRepository.deleteAllInBatch();

        log.info("==== 사용자 통계 테이블 초기화 완료 ====");
    }

    @Scheduled(cron = "0 0 * * * *") //매 정각 실행
    public void runHourlyAggregation(){
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourAgo = now.minusHours(1);

        log.info("사용자 log 집계 시작");
        statsService.aggregateAndSave(oneHourAgo, now);
    }

    /**
     * 매일 23:30에 전날 통계 집계 → DailyAggregateSummary 에 저장
     */
//    @Scheduled(cron = "0 43 9 * * *")
    @Scheduled(cron = "0 30 23 * * *") // 매일 23:30 실행
    @Transactional
    public void aggregateDailySummary() {
        LocalDate today = LocalDate.now();

        log.info("==== DailyAggregateSummary 집계 시작: {} ====", today);

        statsService.aggregateDailySummary(today);

        log.info("==== DailyAggregateSummary 집계 완료: {} ====", today);
    }


}
