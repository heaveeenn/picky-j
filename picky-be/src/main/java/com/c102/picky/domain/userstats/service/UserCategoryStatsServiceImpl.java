package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.CategoryVisitShareDto;
import com.c102.picky.domain.userstats.dto.UserCategoryStatsDto;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import com.c102.picky.domain.userstats.repository.UserCategoryStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCategoryStatsServiceImpl implements UserCategoryStatsService {
    private final UserCategoryStatsRepository userCategoryStatsRepository;

    private static double round1(double v) {
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserCategoryStatsDto> getUserCategoryStats(Long userId) {
        List<UserCategoryStats> entities = userCategoryStatsRepository.findByUserIdOrderByTimeSpentDesc(userId);

        return entities.stream()
                .map(UserCategoryStatsDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryVisitShareDto> getCategoryVisitShare() {
        var rows = userCategoryStatsRepository.sumVisitsByCategory();
        long total = rows.stream().mapToLong(UserCategoryStatsRepository.CategoryVisitAgg::getVisitCount).sum();
        if (total == 0) return List.of();

        return rows.stream()
                .map(r -> new CategoryVisitShareDto(
                        r.getCategoryId(),
                        r.getCategoryName(),
                        r.getVisitCount(),
                        round1(100.0 * r.getVisitCount() / total)
                ))
                .sorted(Comparator.comparingDouble(CategoryVisitShareDto::percent).reversed())
                .toList();
    }
}
