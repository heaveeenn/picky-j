package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.category.repository.CategoryRepository;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.users.repository.UserRepository;
import com.c102.picky.domain.userstats.entity.*;
import com.c102.picky.domain.userstats.repository.*;
import com.c102.picky.global.util.ShardUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class BrowsingStatsServiceImpl implements BrowsingStatsService {
    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserCategoryStatsRepository userCategoryStatsRepository;
    private final UserDomainStatsRepository userDomainStatsRepository;
    private final UserHourlyStatsRepository userHourlyStatsRepository;
    private final DailyAggregateSummaryRepository dailyAggregateSummaryRepository;
    private final UserDailySummaryRepository userDailySummaryRepository;
    private final ShardUtil shardUtil;

    @Override
    public void aggregateAndSave(LocalDateTime from, LocalDateTime to) {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            String userEmail = user.getEmail();
            String collection = shardUtil.getBrowsingCollection(userEmail);

            DateTimeFormatter mongoFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                    .withZone(ZoneOffset.UTC);

            String isoFrom = mongoFormat.format(from.atZone(ZoneId.of("Asia/Seoul")).withZoneSameInstant(ZoneOffset.UTC));
            String isoTo   = mongoFormat.format(to.atZone(ZoneId.of("Asia/Seoul")).withZoneSameInstant(ZoneOffset.UTC));
            Criteria dateCriteria = Criteria.where("timestamp").gte(isoFrom).lte(isoTo);
            Criteria userIdCriteria = Criteria.where("userId").is(userEmail);
            log.info("쿼리 범위 from={}, to={}", isoFrom, isoTo);

            Query query = new Query();
            query.addCriteria(new Criteria().andOperator(userIdCriteria, dateCriteria));
            log.info("실행되는 Query={}", query);
            List<Document> logs = mongoTemplate.find(query, Document.class, collection);
            log.info("로그 개수={}", logs.size());
            log.info("user={} collection={} logs={}", userEmail, collection, logs.size());

            // 기존 집계 로직 실행
            processLogs(user, logs, from, to);
        }
    }

    @Transactional
    @Override
    public void aggregateDailySummary(LocalDate date) {
        Double avgVisitCount = userStatsRepository.calculateAvgVisitCount();
        Double avgBrowsingSeconds = userStatsRepository.calculateAvgBrowsingSeconds();

        // 2. 가장 활발한 시간대
        Integer peakHour = userHourlyStatsRepository.findPeakHour();

        // 3. DailyAggregateSummary 저장
        DailyAggregateSummary summary = DailyAggregateSummary.builder()
                .summaryDate(date)
                .avgVisitCount(avgVisitCount != null ? avgVisitCount : 0.0)
                .avgBrowsingSeconds(avgBrowsingSeconds != null ? Math.round(avgBrowsingSeconds) : 0L)
                .peakHour(peakHour != null ? peakHour : -1)
                .build();

        dailyAggregateSummaryRepository.save(summary);

        // 4. 개인별 요약 저장
        List<UserStats> allUserStats = userStatsRepository.findAll();
        for (UserStats stats : allUserStats) {
            UserDailySummary userSummary = UserDailySummary.builder()
                    .user(stats.getUser())
                    .summaryDate(date)
                    .totalSites(stats.getTotalSites())
                    .totalTimeSpent(stats.getTotalTimeSpent())
                    .build();

            userDailySummaryRepository.save(userSummary);
        }
    }

    private void processLogs(User user, List<Document> logs, LocalDateTime from, LocalDateTime to) {
        // userStats
        Set<String> userDomains = new HashSet<>();
        long userTotalTime = 0;

        // categoryStats
        Map<String, Long> categoryTime = new HashMap<>();
        Map<String, Long> categoryCount = new HashMap<>();

        // domainStats
        Map<String, Long> domainTime = new HashMap<>();
        Map<String, Long> domainCount = new HashMap<>();

        // hourlyStats
        Map<Integer, Long> hourlyTime = new HashMap<>();

        for (Document log : logs) {
            String domain = log.getString("domain");
            String category = log.getString("category");
            Number timeSpentNum = log.get("timeSpent", Number.class);
            long timeSpent = timeSpentNum == null ? 0L : timeSpentNum.longValue();
            Object tsObj = log.get("timestamp");
            LocalDateTime ts = null;
            if (tsObj instanceof Date) {
                ts = ((Date) tsObj).toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            } else if (tsObj instanceof String) {
                ts = Instant.parse((String) tsObj).atZone(ZoneId.systemDefault()).toLocalDateTime();
            }

            if (ts == null) {
                continue;
            }

            int hour = ts.getHour();

            // userStats
            userDomains.add(domain);
            userTotalTime += timeSpent;

            // categoryStats
            categoryTime.merge(category, timeSpent, Long::sum);
            categoryCount.merge(category, 1L, Long::sum);

            // domainStats
            domainTime.merge(domain, timeSpent, Long::sum);
            domainCount.merge(domain, 1L, Long::sum);

            // hourlyStats
            hourlyTime.merge(hour, timeSpent, Long::sum);
        }

        // UserStats 저장
        UserStats stats = userStatsRepository.findByUser(user)
                .orElseGet(() -> UserStats.builder()
                        .user(user)
                        .totalSites(0L)
                        .totalTimeSpent(0L)
                        .build());
        stats.addTotalSites(userDomains.size());
        stats.addTotalTime(userTotalTime);
        userStatsRepository.save(stats);

        // CategoryStats 저장
        categoryTime.forEach((catName, time) -> {
            long count = categoryCount.getOrDefault(catName, 0L);
            categoryRepository.findByName(catName).ifPresent(category -> {
                UserCategoryStats catStats = userCategoryStatsRepository
                        .findByUserAndCategory(user, category)
                        .orElseGet(() -> UserCategoryStats.builder()
                                .user(user)
                                .category(category)  // 캐스팅 제거
                                .timeSpent(0L)
                                .visitCount(0L)
                                .build());

                catStats.addTimeSpent(time);
                catStats.addVisitCount(count);
                userCategoryStatsRepository.save(catStats);
            });
        });

        // DomainStats 저장
        domainTime.forEach((dom, time) -> {
            long count = domainCount.getOrDefault(dom, 0L);
            UserDomainStats domStats = userDomainStatsRepository
                    .findByUserAndDomain(user, dom)
                    .orElseGet(() -> UserDomainStats.builder()
                            .user(user)
                            .domain(dom)
                            .timeSpent(0L)
                            .visitCount(0L)
                            .build());

            domStats.addTimeSpent(time);
            domStats.addVisitCount(count);
            userDomainStatsRepository.save(domStats);
        });

        // HourlyStats 저장
        hourlyTime.forEach((hour, time) -> {
            UserHourlyStats hStats = userHourlyStatsRepository
                    .findByUserAndHour(user, hour)
                    .orElseGet(() -> UserHourlyStats.builder()
                            .user(user)
                            .hour(hour)
                            .timeSpent(0L)
                            .build());

            hStats.addTimeSpent(time);
            userHourlyStatsRepository.save(hStats);
        });
        log.info("집계 완료: user={} 기간 {} ~ {}", user.getEmail(), from, to);
    }
}
