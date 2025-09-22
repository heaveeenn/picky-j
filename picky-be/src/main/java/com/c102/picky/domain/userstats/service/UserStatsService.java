package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserStatsDto;

public interface UserStatsService {
    UserStatsDto getUserStats(Long id);
}
