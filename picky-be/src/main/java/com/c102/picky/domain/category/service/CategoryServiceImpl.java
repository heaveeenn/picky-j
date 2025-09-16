package com.c102.picky.domain.category.service;

import com.c102.picky.domain.category.dto.CategoryRequestDto;
import com.c102.picky.domain.category.dto.CategoryResponseDto;
import com.c102.picky.domain.category.dto.CategoryUpdateRequestDto;
import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.repository.CategoryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;


    @Override
    public CategoryResponseDto createCategory(CategoryRequestDto request) {
        if(request.getLevel() != Category.Level.L1) {
            throw new IllegalArgumentException("현재는 L1 카테고리만 생성할 수 있습니다.");
        }

        categoryRepository.findByNameAndLevel(request.getName(), request.getLevel())
                .ifPresent(c -> { throw new IllegalArgumentException("이미 존재하는 카테고리입니다.");});

        Category c = Category.of(
                request.getName(),
                request.getLevel(),
                toJsonOrNull(request.getAliases()),
                null
        );

        Category saved = categoryRepository.save(c);
        return CategoryResponseDto.from(saved, parseAliases(saved.getAliases()));
    }



    @Override
    public CategoryResponseDto findCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));
        return CategoryResponseDto.from(category, parseAliases(category.getAliases()));
    }

    @Override
    public List<CategoryResponseDto> findCategoriesByLevel(Category.Level level) {
        List<Category> list = categoryRepository.findAllByLevel(level);
        return list.stream().map(c->CategoryResponseDto.from(c, parseAliases(c.getAliases()))).toList();
    }

    @Override
    public CategoryResponseDto updateCategory(Long id, CategoryUpdateRequestDto request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));

        if(request.getName() != null) {
            Long categoryId = category.getId();
            Category.Level level = category.getLevel();
            categoryRepository.findByNameAndLevel(request.getName(), level)
                    .filter(c -> !c.getId().equals(categoryId))
                    .ifPresent(c-> {throw new IllegalArgumentException("동일 레벨에 동일 이름이 존재합니다."); });
            category = category.changeName(request.getName());
        }

        if(request.getAliases() != null) {
            category = category.changeAliases(toJsonOrNull(request.getAliases()));
        }

        return CategoryResponseDto.from(category, parseAliases(category.getAliases()));
    }

    @Override
    public void deleteCategory(Long id) {
        if(!categoryRepository.existsById(id)) return;
        categoryRepository.deleteById(id);
    }


    // =============헬퍼===========
    private List<String> parseAliases(String json) {
        try {
            if(json==null || json.isBlank()) return List.of();
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String toJsonOrNull(List<String> list) {
        try {
            if(list == null) return null;
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw new IllegalArgumentException("aliases 직렬화 실패");
        }
    }
}
