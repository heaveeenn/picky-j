package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserStatsDto;
import com.c102.picky.domain.userstats.entity.UserStats;
import com.c102.picky.domain.userstats.repository.UserStatsRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserStatsServiceImpl implements UserStatsService{
    private final UserStatsRepository userStatsRepository;

    @Override
    @Transactional(readOnly = true)
    public UserStatsDto getUserStats(Long userId) {
        UserStats entity = userStatsRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        return UserStatsDto.fromEntity(entity);
    }
}
