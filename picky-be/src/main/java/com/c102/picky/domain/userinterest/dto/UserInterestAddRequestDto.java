package com.c102.picky.domain.userinterest.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class UserInterestAddRequestDto {
    private List<Long> categoryIds;
}
