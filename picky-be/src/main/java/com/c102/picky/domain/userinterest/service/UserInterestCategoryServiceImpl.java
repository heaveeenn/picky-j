package com.c102.picky.domain.userinterest.service;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.repository.CategoryRepository;
import com.c102.picky.domain.userinterest.dto.UserInterestAddRequestDto;
import com.c102.picky.domain.userinterest.dto.UserInterestResponseDto;
import com.c102.picky.domain.userinterest.entity.UserInterestCategory;
import com.c102.picky.domain.userinterest.repository.UserInterestCategoryRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserInterestCategoryServiceImpl implements UserInterestCategoryService {

    private final UserInterestCategoryRepository uiRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<UserInterestResponseDto> addUserInterests(Long userId, UserInterestAddRequestDto request) {
        for (Long categoryId : request.getCategoryIds()) {
            final Long cid = categoryId;

            Category category = categoryRepository.findById(cid)
                    .orElseThrow(() -> new ApiException(ErrorCode.CATEGORY_NOT_FOUND));

            if (category.getLevel() != Category.Level.L1) {
                throw new ApiException(ErrorCode.INVALID_CATEGORY_LEVEL);
            }

            if(!uiRepository.existsByIdUserIdAndIdCategoryId(userId, cid)) {
                uiRepository.save(UserInterestCategory.of(userId, category));
            }
        }
        return findUserInterests(userId);
    }

    @Override
    public void removeUserInterest(Long userId, Long categoryId) {
        if (!uiRepository.existsByIdUserIdAndIdCategoryId(userId, categoryId)) {
            throw new ApiException(ErrorCode.USER_INTEREST_NOT_FOUND);
        }
        uiRepository.deleteByIdUserIdAndIdCategoryId(userId, categoryId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserInterestResponseDto> findUserInterests(Long userId) {
        return uiRepository.findByIdUserId(userId).stream()
                .map(uic -> UserInterestResponseDto.from(
                        uic.getCategory().getId(),
                        uic.getCategory().getName(),
                        uic.getCategory().getLevel().name()
                ))
                .toList();
    }
}
