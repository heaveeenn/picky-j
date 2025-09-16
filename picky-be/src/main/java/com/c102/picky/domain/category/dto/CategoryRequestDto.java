package com.c102.picky.domain.category.dto;

import com.c102.picky.domain.category.entity.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class CategoryRequestDto {

    @NotNull(message = "level은 필수입니다.")
    private Category.Level level;

    @NotBlank(message = "name은 필수입니다.")
    private String name;

    // null 허용 -> DB에서 DEFAULT JSON_ARRAY() 처리
    private List<String> aliases;
}
