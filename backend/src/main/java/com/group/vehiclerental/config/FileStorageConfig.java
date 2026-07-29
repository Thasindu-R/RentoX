package com.group.vehiclerental.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Makes uploaded vehicle photos reachable from the browser.
 *
 * Files are written to backend/uploads/ and this mapping serves that folder at
 * http://localhost:8080/uploads/<filename>, so an <img> tag in React can point
 * straight at it. The images are NOT stored in the database - the vehicle row
 * only keeps the file name.
 */
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    /** Resolved once so the controller and this mapping agree on the location. */
    public static final Path UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + UPLOAD_DIR + "/");
    }
}
