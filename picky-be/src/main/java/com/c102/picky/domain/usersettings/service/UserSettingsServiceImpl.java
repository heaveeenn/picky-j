package com.c102.picky.domain.usersettings.service;

import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.users.repository.UserRepository;
import com.c102.picky.domain.users.service.UserService;
import com.c102.picky.domain.usersettings.dto.UserSettingsResponseDto;
import com.c102.picky.domain.usersettings.dto.UserSettingsUpdateRequestDto;
import com.c102.picky.domain.usersettings.entity.NotifyType;
import com.c102.picky.domain.usersettings.entity.UserSettings;
import com.c102.picky.domain.usersettings.repository.UserSettingsRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;

@Service
@RequiredArgsConstructor
public class UserSettingsServiceImpl implements UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;

    /**
     * 알림 설정 조회
     */
    @Transactional(readOnly = true)
    public UserSettingsResponseDto findByUserId(Long userId) {
        UserSettings s = userSettingsRepository.findById(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
                    return UserSettings.of(user);
                        }
                );
        return UserSettingsResponseDto.from(s);
    }

    /**
     * 알림 설정 수정
     */
    @Transactional
    public UserSettingsResponseDto updateSettings(Long userId, UserSettingsUpdateRequestDto req) {
        UserSettings s = userSettingsRepository.findById(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
                    return UserSettings.of(user);
                });

        // 1) 비트마스크
        EnumSet<NotifyType> types = EnumSet.noneOf(NotifyType.class);
        if (req.isNewsEnabled()) types.add(NotifyType.NEWS);
        if (req.isQuizEnabled()) types.add(NotifyType.QUIZ);
        if (req.isFactEnabled()) types.add(NotifyType.FACT);
        // 엔티티 도메인 메서드로 반영
        s.changeNotifyTypes(types);

        // 2) interval
        if (req.getNotifyInterval() != null) {
            s.changeNotifyIntervalMinutes(req.getNotifyInterval());
        }

        // 3) enabled
        if (req.isNotifyEnabled()) s.turnOn();
        else s.turnOff();


        // 4) avatarCode
        if (req.getAvatarCode() != null) {
            s.changeAvatarCode(req.getAvatarCode());
        }

        // 5) blocked domains
        if (req.getBlockedDomains() != null) {
            s.setBlockedDomains(req.getBlockedDomains());
        }

        userSettingsRepository.save(s);
        return UserSettingsResponseDto.from(s);
    }
}
