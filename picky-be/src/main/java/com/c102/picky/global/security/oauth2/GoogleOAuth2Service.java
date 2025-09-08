package com.c102.picky.global.security.oauth2;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2Service {
    private final RestTemplate restTemplate = new RestTemplate();
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;
    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;
    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String redirectUri;

    public GoogleUserInfo getUserInfoFromCode(String code) throws Exception {
        Map<String, String> params = new HashMap<>();
        params.put("code", code);
        params.put("client_id", clientId);
        params.put("client_secret", clientSecret);
        params.put("redirect_uri", redirectUri);
        params.put("grant_type", "authorization_code");

        GoogleTokenResponse googleToken = restTemplate.postForObject(
                "https://oauth2.googleapis.com/token",
                new LinkedMultiValueMap<>(params.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> List.of(e.getValue())))),
                        GoogleTokenResponse.class
        );

        // ID Token 파싱
        SignedJWT signedJWT = SignedJWT.parse(googleToken.getIdToken());
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        return new GoogleUserInfo(
                claims.getStringClaim("email"),
                claims.getStringClaim("name"),
                claims.getSubject()
        );
    }

    @Getter
    @AllArgsConstructor
    public static class GoogleUserInfo {
        private String email;
        private String name;
        private String providerId;
    }

    @Getter
    public static class GoogleTokenResponse {
        @JsonProperty("access_token")
        private String accessToken;
        @JsonProperty("expires_in")
        private Long expiresIn;
        @JsonProperty("scope")
        private String scope;
        @JsonProperty("token_type")
        private String tokenType;
        @JsonProperty("id_token")
        private String idToken;
    }

}
