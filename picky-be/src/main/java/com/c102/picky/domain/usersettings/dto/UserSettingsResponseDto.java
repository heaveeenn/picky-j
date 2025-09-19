package com.c102.picky.domain.usersettings.dto;

import com.c102.picky.domain.usersettings.entity.NotifyType;
import com.c102.picky.domain.usersettings.entity.UserSettings;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.List;
import java.util.Set;

@Getter
@ToString
@Builder
public class UserSettingsResponseDto {
    private String avatarCode;
    private List<String> blockedDomains;

    private int notifyType;
    private boolean newsEnabled;
    private boolean quizEnabled;
    private boolean factEnabled;

    private int notifyInterval;
    private boolean notifyEnabled;

    public static UserSettingsResponseDto from(UserSettings us) {
        Set<NotifyType> notifyTypes = us.getNotifyTypes();

        return UserSettingsResponseDto.builder()
                .avatarCode(us.getAvatarCode())
                .blockedDomains(us.getBlockedDomains())
                .notifyType(us.getNotifyType())
                .newsEnabled(notifyTypes.contains(NotifyType.NEWS))
                .quizEnabled(notifyTypes.contains(NotifyType.QUIZ))
                .factEnabled(notifyTypes.contains(NotifyType.FACT))
                .notifyInterval(us.getNotifyInterval())
                .notifyEnabled(us.isNotifyEnabled())
                .build();
    }
}
