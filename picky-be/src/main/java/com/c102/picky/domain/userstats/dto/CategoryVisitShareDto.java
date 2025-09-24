package com.c102.picky.domain.userstats.dto;

public record CategoryVisitShareDto(
        Long categoryId,
        String categoryName,
        long visitCount,
        double percent
) {
}