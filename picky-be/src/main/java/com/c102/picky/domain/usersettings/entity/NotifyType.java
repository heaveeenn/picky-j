package com.c102.picky.domain.usersettings.entity;

import java.util.EnumSet;
import java.util.Set;

public enum NotifyType {
    NEWS(1 << 2),
    QUIZ(1 << 1),
    FACT(1);

    private final int bit;

    NotifyType(int bit) {
        this.bit = bit;
    }

    /**
     * Set<NotifyType> -> bitmask
     */
    public static int toMask(Set<NotifyType> types) {
        int m = 0;
        for (NotifyType type : types) m |= type.bit;
        return m;
    }

    /**
     * bitmask -> EnumSet
     */
    public static EnumSet<NotifyType> fromMask(int mask) {
        EnumSet<NotifyType> set = EnumSet.noneOf(NotifyType.class);
        for (NotifyType type : values()) {
            if((mask & type.bit) != 0) set.add(type);
        }
        return set;
    }

    public int bit() {
        return bit;
    }

    /**
     * 마스크에 해당 타입 포함되어 있는가
     */
    public boolean in(int mask) {
        return (mask & bit) != 0;
    }
}
