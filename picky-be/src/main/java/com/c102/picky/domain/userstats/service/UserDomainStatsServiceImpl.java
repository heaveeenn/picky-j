package com.c102.picky.domain.userstats.service;

import com.c102.picky.domain.userstats.dto.UserDomainStatsDto;
import com.c102.picky.domain.userstats.entity.UserDomainStats;
import com.c102.picky.domain.userstats.repository.UserDomainStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDomainStatsServiceImpl implements UserDomainStatsService{
    private final UserDomainStatsRepository userDomainStatsRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserDomainStatsDto> getUserDomainStats(Long userId) {
        List<UserDomainStats> entities = userDomainStatsRepository.findByUserIdOrderByTimeSpentDesc(userId);

        return entities.stream()
                .map(UserDomainStatsDto::fromEntity)
                .collect(Collectors.toList());
    }
}
