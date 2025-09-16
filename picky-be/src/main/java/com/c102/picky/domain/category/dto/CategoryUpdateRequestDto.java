package com.c102.picky.domain.category.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class CategoryUpdateRequestDto {
    private String name;
    private List<String> aliases;
}
