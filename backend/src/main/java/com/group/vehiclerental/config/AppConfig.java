package com.group.vehiclerental.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Shared beans.
 *
 * BCrypt turns "mypassword123" into a 60-character hash like
 * $2a$10$N9qo8uLOickgx2ZMRZoMy...  Two things make it the right choice:
 *
 *  1. It is one-way. The database never holds a password we could read back,
 *     so a leaked customer table does not hand over anyone's password.
 *  2. It salts automatically, so two customers who pick the same password
 *     still get different hashes.
 *
 * encoder.matches(raw, hash) is how login checks a password - we hash the
 * attempt and compare, we never decrypt the stored value.
 */
@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
