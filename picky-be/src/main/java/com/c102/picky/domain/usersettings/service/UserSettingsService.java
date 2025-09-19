package com.c102.picky.domain.usersettings.service;

import com.c102.picky.domain.usersettings.dto.UserSettingsResponseDto;
import com.c102.picky.domain.usersettings.dto.UserSettingsUpdateRequestDto;

public interface UserSettingsService {
    UserSettingsResponseDto findByUserId(Long userId);
    UserSettingsResponseDto updateSettings(Long userId, UserSettingsUpdateRequestDto req);
}
