package com.c102.picky.domain.users.service;

import com.c102.picky.domain.users.dto.UserUpdateProfileRequestDto;
import com.c102.picky.domain.users.dto.UserResponseDto;

public interface UserService {
    UserResponseDto getMe(String googleSub);
    UserResponseDto upsertGoogleUser(String googleSub, String email, String nickname, String profileImage);
    UserResponseDto updateProfile(String googleSub, UserUpdateProfileRequestDto userUpdateProfileRequestDto);
    void withdraw(String googleSub);
}
