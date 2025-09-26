package com.c102.picky.global.util;
import lombok.experimental.UtilityClass;

@UtilityClass
public class StatsFormatUtil {
    // 시간(0~23)을 "HH:00" 포맷으로 변환
    public static String formatHour(Integer hour) {
        if (hour == null) return "00:00";
        return String.format("%02d:00", hour);
    }

    // 초 단위를 "HH:mm:ss" 포맷으로 변환
    public static String formatDuration(Long seconds) {
        if (seconds == null) return "00:00:00";
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        return String.format("%02d:%02d:%02d", h, m, s);
    }

}
