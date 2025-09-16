package com.c102.picky.domain.userInterest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInterestResponseDto {
    private Long categoryId;
    private String name;
    private String level;

    public static UserInterestResponseDto from(Long categoryId, String name, String level) {
        return UserInterestResponseDto.builder()
                .categoryId(categoryId)
                .name(name)
                .level(level)
                .build();
    }
}
