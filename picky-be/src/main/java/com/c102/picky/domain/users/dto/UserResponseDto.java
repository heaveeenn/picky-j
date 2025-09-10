package com.c102.picky.domain.users.dto;

import com.c102.picky.domain.users.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponseDto {
    private Long id;
    private String email;
    private String googleSub;
    private String nickname;
    private String profileImage;
    private Role role;

    public static UserResponseDto from(User u) {
        return UserResponseDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .googleSub(u.getGoogleSub())
                .nickname(u.getNickname())
                .profileImage(u.getProfileImage())
                .role(u.getRole())
                .build();
    }
}
