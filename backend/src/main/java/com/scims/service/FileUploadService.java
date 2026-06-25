package com.scims.service;

import com.scims.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Handles file upload and deletion for complaint images and profile photos.
 *
 * Storage layout on disk:
 *   {app.upload.dir}/complaints/{uuid}.jpg
 *   {app.upload.dir}/profiles/{uuid}.jpg
 *
 * The value stored in the DB and returned in imageUrls is the RELATIVE path
 * under uploadDir, e.g. "complaints/abc.jpg". The URL served to clients is
 * "/uploads/complaints/abc.jpg" via the static resource handler in AppConfig.
 */
@Service
@Slf4j
public class FileUploadService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES =
            Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");

    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5 MB

    /**
     * Saves a file under uploadDir/{subDir}/{uuid}.{ext}.
     *
     * @param file   the uploaded multipart file
     * @param subDir sub-directory name, e.g. "complaints" or "profiles"
     * @return relative path stored in DB, e.g. "complaints/uuid.jpg"
     */
    public String uploadImage(MultipartFile file, String subDir) {
        validateFile(file);
        try {
            Path uploadPath = Paths.get(uploadDir, subDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String extension = getExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "." + extension;
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File uploaded successfully: {}", filePath.toAbsolutePath());
            // Return relative path only (subDir/fileName), NOT the full disk path
            return subDir + "/" + fileName;
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Deletes a file given its relative path (as stored in DB).
     *
     * Previously the method received a relative path like "complaints/abc.jpg"
     * but then called Paths.get(uploadDir, filePath) which produced the correct
     * path. However when the stored path accidentally contained the uploadDir
     * prefix, it would build a double path. This version always strips any
     * leading uploadDir prefix before resolving, making it idempotent.
     */
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            // Strip leading uploadDir prefix if accidentally present
            String cleanPath = relativePath.startsWith(uploadDir)
                    ? relativePath.substring(uploadDir.length()).replaceAll("^[/\\\\]+", "")
                    : relativePath.replaceAll("^[/\\\\]+", "");

            Path path = Paths.get(uploadDir).resolve(cleanPath);
            boolean deleted = Files.deleteIfExists(path);
            if (deleted) {
                log.info("File deleted: {}", path.toAbsolutePath());
            } else {
                log.warn("File not found for deletion (already gone?): {}", path.toAbsolutePath());
            }
        } catch (IOException e) {
            log.warn("Could not delete file '{}': {}", relativePath, e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty or missing");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("File size exceeds 5 MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException(
                "Only JPEG, PNG, GIF, and WEBP images are allowed. Got: " + contentType);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
