package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserDomainStatsDto;

import java.util.List;

public interface UserDomainStatsService {
    List<UserDomainStatsDto> getUserDomainStats(Long id);
}
