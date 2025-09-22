package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserCategoryStatsDto;

import java.util.List;

public interface UserCategoryStatsService {
    List<UserCategoryStatsDto> getUserCategoryStats(Long id);
}
