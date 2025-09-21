package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.repository.CategoryRepository;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.users.repository.UserRepository;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import com.c102.picky.domain.userstats.entity.UserDomainStats;
import com.c102.picky.domain.userstats.entity.UserHourlyStats;
import com.c102.picky.domain.userstats.entity.UserStats;
import com.c102.picky.domain.userstats.repository.UserCategoryStatsRepository;
import com.c102.picky.domain.userstats.repository.UserDomainStatsRepository;
import com.c102.picky.domain.userstats.repository.UserHourlyStatsRepository;
import com.c102.picky.domain.userstats.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

    @Value("${app.mongodb.browsing-collection}")
    private String browsingCollection;

    @Override
    public void aggregateAndSave(LocalDateTime from, LocalDateTime to) {
        log.info("browsingCollection name = {}", browsingCollection);
        List<Document> logs = mongoTemplate.findAll(Document.class, browsingCollection);
        log.info("몽고에서 읽은 로그 개수 = {}", logs.size());

        // userStats
        Map<Long, Set<String>> userDomains = new HashMap<>();
        Map<Long, Long> userTotalTime = new HashMap<>();

        // categoryStats
        Map<Long, Map<String, Long>> categoryTime = new HashMap<>();
        Map<Long, Map<String, Long>> categoryCount = new HashMap<>();

        // domainStats
        Map<Long, Map<String, Long>> domainTime = new HashMap<>();
        Map<Long, Map<String, Long>> domainCount = new HashMap<>();

        // hourlyStats
        Map<Long, Map<Integer, Long>> hourlyTime = new HashMap<>();

        for (Document log : logs) {
            String userEmail = log.getString("userId");
            Long userId = userRepository.findByEmail(userEmail)
                    .map(User::getId)
                    .orElse(null);
            if (userId == null) continue;

            String domain = log.getString("domain");
            String category = log.getString("category");
            long timeSpent = log.getInteger("timeSpent", 0);
            String tsStr = log.getString("timestamp");
            LocalDateTime ts = Instant.parse(tsStr)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();
            if (ts.isBefore(from) || !ts.isBefore(to)) continue; // 시간 범위 밖이면 skip
            int hour = ts.getHour();

            // userStats
            userDomains.computeIfAbsent(userId, k -> new HashSet<>()).add(domain);
            userTotalTime.merge(userId, timeSpent, Long::sum);

            // categoryStats
            categoryTime.computeIfAbsent(userId, k -> new HashMap<>())
                    .merge(category, timeSpent, Long::sum);
            categoryCount.computeIfAbsent(userId, k -> new HashMap<>())
                    .merge(category, 1L, Long::sum);

            // domainStats
            domainTime.computeIfAbsent(userId, k -> new HashMap<>())
                    .merge(domain, timeSpent, Long::sum);
            domainCount.computeIfAbsent(userId, k -> new HashMap<>())
                    .merge(domain, 1L, Long::sum);

            // hourlyStats
            hourlyTime.computeIfAbsent(userId, k -> new HashMap<>())
                    .merge(hour, timeSpent, Long::sum);
        }

        log.info("집계 완료: userTotalTime.size={} categoryTime.size={} domainTime.size={} hourlyTime.size={}",
                userTotalTime.size(), categoryTime.size(), domainTime.size(), hourlyTime.size());

        // mysql 저장
        userTotalTime.forEach((userId, totalTime) -> {
            userRepository.findById(userId).ifPresent(user -> {
                long totalSites = userDomains.getOrDefault(userId, Set.of()).size();
                UserStats stats = userStatsRepository.findByUser(user)
                        .orElseGet(() -> UserStats.builder()
                                .user(user)
                                .totalSites(0L)
                                .totalTimeSpent(0L)
                                .build());
                stats.addTotalSites(totalSites);
                stats.addTotalTime(totalTime);
                userStatsRepository.save(stats);
            });
        });

        categoryTime.forEach((userId, catMap) ->
                userRepository.findById(userId).ifPresent(user -> {
                    catMap.forEach((catName, time) -> {
                        long count = categoryCount.get(userId).getOrDefault(catName, 0L);
                        categoryRepository.findByName(catName).ifPresent(category -> {
                            UserCategoryStats stats = userCategoryStatsRepository
                                    .findByUserAndCategory(user, (Category) category)
                                    .orElseGet(() -> UserCategoryStats.builder()
                                            .user(user)
                                            .category((Category) category)
                                            .timeSpent(0L)
                                            .visitCount(0L)
                                            .build());

                            stats.addTimeSpent(time);
                            stats.addVisitCount(count);

                            userCategoryStatsRepository.save(stats);
                        });
                    });
                })
        );

        // DomainStats
        domainTime.forEach((userId, domMap) ->
                userRepository.findById(userId).ifPresent(user -> {
                    domMap.forEach((dom, time) -> {
                        long count = domainCount.get(userId).getOrDefault(dom, 0L);
                        UserDomainStats stats = userDomainStatsRepository
                                .findByUserAndDomain(user, dom)
                                .orElseGet(() -> UserDomainStats.builder()
                                        .user(user)
                                        .domain(dom)
                                        .timeSpent(0L)
                                        .visitCount(0L)
                                        .build());
                        stats.addTimeSpent(time);
                        stats.addVisitCount(count);
                        userDomainStatsRepository.save(stats);
                    });
                })
        );

        // HourlyStats
        hourlyTime.forEach((userId, hourMap) ->
                userRepository.findById(userId).ifPresent(user -> {
                    hourMap.forEach((hour, time) -> {
                        UserHourlyStats stats = userHourlyStatsRepository
                                .findByUserAndHour(user, hour)
                                .orElseGet(() -> UserHourlyStats.builder()
                                        .user(user)
                                        .hour(hour)
                                        .timeSpent(0L)
                                        .build());
                        stats.addTimeSpent(time);
                        userHourlyStatsRepository.save(stats);
                    });
                })
        );

        log.info("집계 완료: {} ~ {}", from, to);

    }
}
