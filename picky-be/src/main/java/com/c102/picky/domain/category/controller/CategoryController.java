package com.c102.picky.domain.category.controller;

import com.c102.picky.domain.category.dto.CategoryRequestDto;
import com.c102.picky.domain.category.dto.CategoryResponseDto;
import com.c102.picky.domain.category.dto.CategoryUpdateRequestDto;
import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.service.CategoryService;
import com.c102.picky.global.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    /**
     * L1 카테고리 생성
     * @param request
     * @param httpRequest
     * @return
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponseDto>> createCategory(
            @Valid @RequestBody CategoryRequestDto request,
            HttpServletRequest httpRequest
    ) {
        CategoryResponseDto response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(HttpStatus.CREATED, "카테고리 생성 성공", response, httpRequest.getRequestURI()));
    }

    /**
     * 단건 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponseDto>> getCategory(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        CategoryResponseDto response = categoryService.findCategoryById(id);
        return ResponseEntity.ok(
                ApiResponse.of(HttpStatus.OK, "카테고리 조회 성공", response, httpRequest.getRequestURI())
        );
    }

    /**
     * 레벨별 목록 조회(/api/categories?Level=L1)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponseDto>>> getAllCategories(
            @RequestParam(name = "level", defaultValue = "L1") Category.Level level,
            HttpServletRequest httpRequest
    ) {
        List<CategoryResponseDto> response = categoryService.findCategoriesByLevel(level);
        return ResponseEntity.ok(
                ApiResponse.of(HttpStatus.OK, "카테고리 목록 조회 성공", response, httpRequest.getRequestURI())
        );
    }

    /**
     * 카테고리 수정( name / aliases)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponseDto>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequestDto request,
            HttpServletRequest httpRequest
    ) {
        CategoryResponseDto response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(
                ApiResponse.of(HttpStatus.OK, "카테고리 수정 성공", response, httpRequest.getRequestURI())
        );
    }

    /**
     * 카테고리 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponseDto>> deleteCategory(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.of(HttpStatus.OK, "카테고리 삭제 성공",  null, httpRequest.getRequestURI()));
    }
}
