package com.c102.picky.domain.category.service;

import com.c102.picky.domain.category.dto.CategoryRequestDto;
import com.c102.picky.domain.category.dto.CategoryResponseDto;
import com.c102.picky.domain.category.dto.CategoryUpdateRequestDto;
import com.c102.picky.domain.category.entity.Category;

import java.util.List;

public interface CategoryService {

    CategoryResponseDto createCategory(CategoryRequestDto request);

    CategoryResponseDto findCategoryById(Long id);

    List<CategoryResponseDto> findCategoriesByLevel(Category.Level level);

    CategoryResponseDto updateCategory(Long id, CategoryUpdateRequestDto request);

    void deleteCategory(Long id);
}
