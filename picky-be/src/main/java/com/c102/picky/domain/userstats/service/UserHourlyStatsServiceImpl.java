package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserHourlyStatsDto;
import com.c102.picky.domain.userstats.entity.UserHourlyStats;
import com.c102.picky.domain.userstats.repository.UserHourlyStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserHourlyStatsServiceImpl implements UserHourlyStatsService{
    private final UserHourlyStatsRepository userHourlyStatsRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserHourlyStatsDto> getUserHourlyStats(Long userId) {
        List<UserHourlyStats> entities = userHourlyStatsRepository.findByUserId(userId);

        return entities.stream()
                .map(UserHourlyStatsDto::fromEntity)
                .collect(Collectors.toList());
    }
}
