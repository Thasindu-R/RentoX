package com.group.vehiclerental.service;

import com.group.vehiclerental.config.FileStorageConfig;
import com.group.vehiclerental.exception.BusinessRuleException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Saving and deleting uploaded images.
 *
 * Vehicles and customers both keep only a file name on their row; the bytes
 * live in backend/uploads/ and are served from there by FileStorageConfig.
 * Both go through here so the size limit, the accepted types and the guard
 * against crafted file names stay in one place.
 */
@Service
public class ImageStorageService {

    /** Image types we accept. Anything else is rejected before we touch disk. */
    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "webp", "gif");

    private static final long MAX_BYTES = 5L * 1024 * 1024;   // 5 MB

    /**
     * Writes an uploaded image and returns the generated file name to store.
     *
     * @param prefix what the picture is of, e.g. "vehicle" or "customer"
     * @param id     the row it belongs to, so the file is recognisable on disk
     */
    public String store(String prefix, Integer id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("No image file was uploaded");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessRuleException("Image must be 5 MB or smaller");
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessRuleException(
                    "Image must be one of " + ALLOWED_EXTENSIONS + " but was ." + extension);
        }

        // A generated name, never the name the browser sent. A crafted filename
        // like "../../application.properties" could otherwise escape the folder.
        String filename = prefix + "-" + id + "-" + UUID.randomUUID().toString().substring(0, 8)
                + "." + extension;

        try {
            Path dir = FileStorageConfig.UPLOAD_DIR;
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new BusinessRuleException("Invalid image file name");
            }
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new BusinessRuleException("Could not save the image: " + e.getMessage());
        }

        return filename;
    }

    /** Removes a stored file. A missing one is not an error. */
    public void delete(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path existing = FileStorageConfig.UPLOAD_DIR.resolve(filename).normalize();
            if (existing.startsWith(FileStorageConfig.UPLOAD_DIR)) {
                Files.deleteIfExists(existing);
            }
        } catch (IOException ignored) {
            // A leftover file is not worth failing the request over.
        }
    }

    private String extensionOf(String originalName) {
        if (originalName == null || !originalName.contains(".")) {
            return "";
        }
        return originalName.substring(originalName.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT).trim();
    }
}
