package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.repository.CategoryRepository;
import com.c102.picky.domain.userstats.dto.CategorySummaryDto;
import com.c102.picky.domain.userstats.dto.DailyAggregateSummaryDto;
import com.c102.picky.domain.userstats.dto.DomainSummaryDto;
import com.c102.picky.domain.userstats.entity.DailyAggregateSummary;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import com.c102.picky.domain.userstats.entity.UserDomainStats;
import com.c102.picky.domain.userstats.repository.DailyAggregateSummaryRepository;
import com.c102.picky.domain.userstats.repository.UserCategoryStatsRepository;
import com.c102.picky.domain.userstats.repository.UserDomainStatsRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyAggregateSummaryServiceImpl implements DailyAggregateSummaryService{
    private final DailyAggregateSummaryRepository dailyAggregateSummaryRepository;
    private final UserDomainStatsRepository userDomainStatsRepository;
    private final UserCategoryStatsRepository userCategoryStatsRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    @Override
    public DailyAggregateSummaryDto getYesterdaySummary() {
        LocalDate yesterday = LocalDate.now().minusDays(1); // 운영
        // LocalDate yesterday = LocalDate.now(); // 테스트
        DailyAggregateSummary summary = dailyAggregateSummaryRepository.findBySummaryDate(yesterday)
                .orElseThrow(() -> new ApiException(ErrorCode.SUMMARY_NOT_FOUND));
        return DailyAggregateSummaryDto.from(summary);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CategorySummaryDto> getCategorySummary() {
        // 1. 모든 카테고리 가져오기
        List<Category> allCategories = categoryRepository.findAll();

        // 2. 모든 사용자-카테고리 통계 불러오기
        List<UserCategoryStats> allStats = userCategoryStatsRepository.findAll();

        // 3. 사용자별 대표 카테고리(timeSpent 기준)
        Map<Long, UserCategoryStats> topCategoriesByUser = allStats.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getUser().getId(),
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparingLong(UserCategoryStats::getTimeSpent)),
                                Optional::get
                        )
                ));

        // 4. 대표 카테고리별 사용자 id 묶기
        Map<Category, List<Long>> usersByCategory = new HashMap<>();
        for (UserCategoryStats stat : topCategoriesByUser.values()) {
            usersByCategory
                    .computeIfAbsent(stat.getCategory(), k -> new ArrayList<>())
                    .add(stat.getUser().getId());
        }

        // 5. 카테고리별 도메인 방문 합산 후 Top 5 추출
        List<CategorySummaryDto> result = new ArrayList<>();
        for (Category category : allCategories) {
            List<Long> userIds = usersByCategory.getOrDefault(category, Collections.emptyList());

            Map<String, Long> domainCountMap = new HashMap<>();
            for (Long userId : userIds) {
                List<UserDomainStats> domainStats = userDomainStatsRepository.findByUserId(userId);
                for (UserDomainStats ds : domainStats) {
                    domainCountMap.merge(ds.getDomain(), ds.getVisitCount(), Long::sum);
                }
            }

            List<DomainSummaryDto> topDomains = domainCountMap.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(5)
                    .map(e -> DomainSummaryDto.of(e.getKey(), e.getValue()))
                    .toList();

            // 도메인 데이터가 없어도 빈 리스트 반환
            result.add(new CategorySummaryDto(category.getName(), topDomains));
        }

        return result;
    }
}
