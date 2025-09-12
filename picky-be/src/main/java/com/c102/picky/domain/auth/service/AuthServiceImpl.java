package com.c102.picky.domain.auth.service;

import com.c102.picky.domain.auth.dto.GoogleLoginRequestDto;
import com.c102.picky.domain.auth.dto.RefreshTokenRequestDto;
import com.c102.picky.domain.auth.dto.TokenResponseDto;
import com.c102.picky.domain.users.dto.Role;
import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.users.repository.UserRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import com.c102.picky.global.security.jwt.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Override
    @Transactional
    public TokenResponseDto googleLogin(GoogleLoginRequestDto request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                throw new ApiException(ErrorCode.INVALID_GOOGLE_TOKEN);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleSub = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            User user = userRepository.findByGoogleSub(googleSub)
                    .orElseGet(() -> {
                        User newUser = User.of(googleSub, email, name, picture, Role.USER);
                        return userRepository.save(newUser);
                    });

            return jwtTokenProvider.createTokenResponse(user.getGoogleSub(), user.getRole().name());

        } catch (GeneralSecurityException | IOException e) {
            log.error("Google ID token verification failed", e);
            throw new ApiException(ErrorCode.GOOGLE_TOKEN_VERIFICATION_FAILED);
        }
    }

    @Override
    public TokenResponseDto refreshToken(RefreshTokenRequestDto request) {
        String refreshToken = request.getRefreshToken();
        
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new ApiException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String googleSub = jwtTokenProvider.getSubject(refreshToken);
        User user = userRepository.findByGoogleSub(googleSub)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        return jwtTokenProvider.createTokenResponse(user.getGoogleSub(), user.getRole().name());
    }

    @Override
    public void logout(HttpServletRequest request) {
        log.info("User logout processed");
    }
}