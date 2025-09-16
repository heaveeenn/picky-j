package com.c102.picky.domain.userInterest.service;

import com.c102.picky.domain.userInterest.dto.UserInterestAddRequestDto;
import com.c102.picky.domain.userInterest.dto.UserInterestResponseDto;

import java.util.List;

public interface UserInterestCategoryService {

    List<UserInterestResponseDto> addUserInterests(Long userId, UserInterestAddRequestDto request);

    void removeUserInterest(Long userId, Long categoryId);

    List<UserInterestResponseDto> findUserInterests(Long userId);

}
