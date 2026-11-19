package com.trackr.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        // HMAC-SHA256 requires at least 32 bytes
        String secret = "test-secret-key-that-is-at-least-32-bytes-long!";
        long accessExpiration = 900_000;   // 15 minutes
        long refreshExpiration = 604_800_000; // 7 days
        jwtTokenProvider = new JwtTokenProvider(secret, accessExpiration, refreshExpiration);
    }

    @Test
    void generateAccessToken_returnsValidJwtWithAccessType() {
        String token = jwtTokenProvider.generateAccessToken(1L, "john@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getTokenType(token)).isEqualTo("access");
    }

    @Test
    void generateRefreshToken_returnsValidJwtWithRefreshType() {
        String token = jwtTokenProvider.generateRefreshToken(1L, "john@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getTokenType(token)).isEqualTo("refresh");
    }

    @Test
    void getUserIdFromToken_extractsCorrectUserId() {
        String token = jwtTokenProvider.generateAccessToken(42L, "test@example.com");

        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    void getTokenType_returnsCorrectTypeForEachToken() {
        String accessToken = jwtTokenProvider.generateAccessToken(1L, "test@example.com");
        String refreshToken = jwtTokenProvider.generateRefreshToken(1L, "test@example.com");

        assertThat(jwtTokenProvider.getTokenType(accessToken)).isEqualTo("access");
        assertThat(jwtTokenProvider.getTokenType(refreshToken)).isEqualTo("refresh");
    }

    @Test
    void validateToken_returnsTrueForValidToken() {
        String token = jwtTokenProvider.generateAccessToken(1L, "test@example.com");

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_returnsFalseForMalformedToken() {
        assertThat(jwtTokenProvider.validateToken("not.a.valid.token")).isFalse();
    }

    @Test
    void validateToken_returnsFalseForTokenWithWrongSignature() {
        String otherSecret = "another-secret-key-that-is-at-least-32-bytes!!";
        JwtTokenProvider otherProvider = new JwtTokenProvider(otherSecret, 900_000, 604_800_000);
        String token = otherProvider.generateAccessToken(1L, "test@example.com");

        assertThat(jwtTokenProvider.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForExpiredToken() {
        // Create provider with 0ms expiration so tokens expire immediately
        JwtTokenProvider expiredProvider = new JwtTokenProvider(
                "test-secret-key-that-is-at-least-32-bytes-long!", 0, 0);
        String token = expiredProvider.generateAccessToken(1L, "test@example.com");

        assertThat(jwtTokenProvider.validateToken(token)).isFalse();
    }
}
