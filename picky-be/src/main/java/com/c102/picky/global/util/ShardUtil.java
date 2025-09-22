package com.c102.picky.global.util;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.security.MessageDigest;

@Component
@RequiredArgsConstructor
public class ShardUtil {
    @Value("${app.mongodb.browsing-prefix}")
    private String browsingPrefix;

    @Value("${app.mongodb.history-prefix}")
    private String historyPrefix;

    public String getCollectionName(String userId, String prefix) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(userId.getBytes());
            BigInteger hashInt = new BigInteger(1, hashBytes);
            int shardId = hashInt.mod(BigInteger.valueOf(5)).intValue();
            return prefix + "_data_" + shardId;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String getBrowsingCollection(String userId) {
        return getCollectionName(userId, browsingPrefix);
    }

    public String getHistoryCollection(String userId) {
        return getCollectionName(userId, historyPrefix);
    }
}
