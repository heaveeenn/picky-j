package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserCategoryStatsDto;
import com.c102.picky.domain.userstats.entity.UserCategoryStats;
import com.c102.picky.domain.userstats.repository.UserCategoryStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCategoryStatsServiceImpl implements UserCategoryStatsService{
    private final UserCategoryStatsRepository userCategoryStatsRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserCategoryStatsDto> getUserCategoryStats(Long userId) {
        List<UserCategoryStats> entities = userCategoryStatsRepository.findByUserIdOrderByTimeSpentDesc(userId);

        return entities.stream()
                .map(UserCategoryStatsDto::fromEntity)
                .collect(Collectors.toList());
    }
}
