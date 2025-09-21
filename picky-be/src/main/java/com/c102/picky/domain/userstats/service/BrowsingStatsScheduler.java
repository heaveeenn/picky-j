package com.c102.picky.domain.userstats.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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

    @Scheduled(cron = "0 * * * * *") // test
    //@Scheduled(cron = "0 0 * * * *")
    public void runHourlyAggregation(){
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourAgo = now.minusHours(1);

        log.info("사용자 log 집계 시작");
        statsService.aggregateAndSave(oneHourAgo, now);
    }

}
