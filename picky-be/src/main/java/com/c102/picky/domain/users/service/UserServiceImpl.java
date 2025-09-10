package com.c102.picky.domain.users.service;

import com.c102.picky.domain.users.dto.Role;
import com.c102.picky.domain.users.dto.UserUpdateProfileRequestDto;
import com.c102.picky.domain.users.dto.UserResponseDto;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.users.repository.UserRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Override
    public UserResponseDto getMe(String googleSub) {
        User user = userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        return UserResponseDto.from(user);
    }

    /**
     * 구글 로그인 성공 시 호출 : users 테이블에  upsert
     * @param googleSub
     * @param email
     * @param nickname
     * @param profileImage
     * @return
     */
    @Transactional
    @Override
    public UserResponseDto upsertGoogleUser(String googleSub, String email, String nickname, String profileImage) {
        User user = userRepository.findByGoogleSub(googleSub)
                .map(u -> {
                    // 프로필 최신화
                    if(nickname != null && !nickname.equals(u.getNickname())) u.changeNickname(nickname);
                    if(profileImage != null && !profileImage.equals(u.getProfileImage())) u.updateProfileImage(profileImage);
                    return u;
                })
                .orElseGet(() -> User.of(googleSub, email, nickname, profileImage, Role.USER));

        User saved = userRepository.save(user);
        return UserResponseDto.from(saved);
    }

    @Transactional
    @Override
    public UserResponseDto updateProfile(String googleSub, UserUpdateProfileRequestDto userUpdateProfileRequestDto) {
        User user = userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if(userUpdateProfileRequestDto.getNickname() != null) user.changeNickname(userUpdateProfileRequestDto.getNickname());
        if(userUpdateProfileRequestDto.getProfileImage() != null) user.updateProfileImage(userUpdateProfileRequestDto.getProfileImage());

        return UserResponseDto.from(user);
    }

    @Transactional
    @Override
    public void withdraw(String googleSub) {
        User user = userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        userRepository.delete(user);
    }
}
