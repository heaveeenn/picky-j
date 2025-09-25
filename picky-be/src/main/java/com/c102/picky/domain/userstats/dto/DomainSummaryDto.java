package com.c102.picky.domain.userstats.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DomainSummaryDto {
    private String domain;
    private Long visitCount;
}
