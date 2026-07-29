package com.group.vehiclerental.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The React dev server runs on http://localhost:5173 and this API runs on
 * http://localhost:8080. Different ports count as different origins, so the
 * browser blocks the requests unless the server says they are allowed. This
 * class is that permission.
 *
 * Without it, every Axios call fails in the browser console with
 * "blocked by CORS policy" - while the same URL works fine in Postman, because
 * Postman is not a browser and does not enforce the rule.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
