package com.c102.picky.domain.userinterest.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;

import java.util.List;

@Getter
public class UserInterestAddRequestDto {
    @NotEmpty(message = "categoryIds는 비어있을 수 없습니다.")
    private List<Long> categoryIds;
}
