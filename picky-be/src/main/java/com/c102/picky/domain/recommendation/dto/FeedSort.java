package com.c102.picky.domain.recommendation.dto;

public enum FeedSort {
    LATEST,      // slotAt DESC, id DESC
    PRIORITY,    // priority ASC, slotAt DESC, id DESC
    MIXED        // slotAt DESC, priority ASC, id DESC (기본)
}