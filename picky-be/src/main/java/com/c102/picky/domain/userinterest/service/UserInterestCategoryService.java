package com.c102.picky.domain.userinterest.service;

import com.c102.picky.domain.userinterest.dto.UserInterestAddRequestDto;
import com.c102.picky.domain.userinterest.dto.UserInterestResponseDto;

import java.util.List;

public interface UserInterestCategoryService {

    List<UserInterestResponseDto> addUserInterests(Long userId, UserInterestAddRequestDto request);

    void removeUserInterest(Long userId, Long categoryId);

    List<UserInterestResponseDto> findUserInterests(Long userId);

}
