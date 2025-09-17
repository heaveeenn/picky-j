package com.c102.picky.domain.usersettings.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class UserSettingsUpdateRequestDto {
    // 비트 입력 대신 토글로
    private boolean newsEnabled;
    private boolean quizEnabled;
    private boolean factEnabled;

    private Integer notifyInterval;
    private boolean notifyEnabled;
    private String avatarCode;
    private List<String> blockedDomains;
}
