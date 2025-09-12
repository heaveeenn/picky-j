package com.c102.picky.domain.users.controller;

import com.c102.picky.domain.users.dto.UserUpdateProfileRequestDto;
import com.c102.picky.domain.users.dto.UserResponseDto;
import com.c102.picky.domain.users.service.UserService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RequiredArgsConstructor
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    /**
     * 내 정보 조회
     * @param request 인증 필터에서 subject(googleSub)를 request attribute "sub"로 전달
     * @return 사용자 정보
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDto>> me(HttpServletRequest request) {
        String sub = (String) request.getAttribute("sub");
        UserResponseDto response = userService.getMe(sub);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "회원 정보 조회 성공", response, request.getRequestURI()));
    }

    /**
     * 내 프로필 수정(닉네임/프로필 이미지 등)
     * @param request 인증 필터에서 subject(googleSub)를 request attribute "sub"로 전달
     * @param requestDto 수정 요청 DTO
     * @return 수정된 사용자 정보
     */
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateMe(HttpServletRequest request,
                                                                 @RequestBody @Valid UserUpdateProfileRequestDto requestDto) {
        String sub = (String) request.getAttribute("sub");
        UserResponseDto data = userService.updateProfile(sub, requestDto);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "회원 접보 수정 성공", data, request.getRequestURI()));
    }

    /**
     * 회원 탈퇴
     * @param request 인증 필터에서 subject(googleSub)를 request attribute "sub"로 전달
     * @return
     */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDto>> deleteMe(HttpServletRequest request) {
        String sub = (String) request.getAttribute("sub");
        userService.withdraw(sub);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.of(HttpStatus.OK, "회원 탈퇴 성공", null, request.getRequestURI()));
    }

}
