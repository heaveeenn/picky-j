package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserHourlyStatsDto;

import java.util.List;

public interface UserHourlyStatsService {
    List<UserHourlyStatsDto> getUserHourlyStats(Long id);
}
