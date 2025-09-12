package com.c102.picky.domain.users.dto;

import lombok.Getter;

@Getter
public class UserUpdateProfileRequestDto {
    private String nickname;
    private String profileImage;
}
