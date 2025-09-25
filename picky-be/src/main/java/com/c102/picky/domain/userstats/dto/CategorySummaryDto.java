package com.c102.picky.domain.userstats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorySummaryDto {
    private String categoryName;
    private List<DomainSummaryDto> topDomains;
}
