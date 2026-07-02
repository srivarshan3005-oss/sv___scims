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
 *
 * Security: original filenames from clients are NEVER used for storage —
 * only the UUID-based generated filename is used, preventing path traversal.
 */
@Service
@Slf4j
public class FileUploadService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES =
            Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");

    private static final List<String> ALLOWED_EXTENSIONS =
            Arrays.asList("jpg", "jpeg", "png", "gif", "webp");

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

        // Sanitize subDir — only allow alphanumeric
        if (!subDir.matches("[a-zA-Z0-9]+")) {
            throw new BadRequestException("Invalid storage sub-directory");
        }

        try {
            Path uploadPath = Paths.get(uploadDir, subDir).normalize();

            // Prevent path traversal: ensure uploadPath is under uploadDir
            Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!uploadPath.toAbsolutePath().normalize().startsWith(baseDir)) {
                throw new BadRequestException("Invalid upload path");
            }

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = getSafeExtension(file);
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
     * Strips any accidental leading uploadDir prefix before resolving.
     */
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            // Strip leading uploadDir prefix if accidentally present
            String cleanPath = relativePath.startsWith(uploadDir)
                    ? relativePath.substring(uploadDir.length()).replaceAll("^[/\\\\]+", "")
                    : relativePath.replaceAll("^[/\\\\]+", "");

            Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = basePath.resolve(cleanPath).normalize();

            // Prevent path traversal
            if (!path.startsWith(basePath)) {
                log.warn("Path traversal attempt blocked: {}", relativePath);
                return;
            }

            boolean deleted = Files.deleteIfExists(path);
            if (deleted) {
                log.info("File deleted: {}", path.toAbsolutePath());
            } else {
                log.warn("File not found for deletion: {}", path.toAbsolutePath());
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
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException(
                "Only JPEG, PNG, GIF, and WEBP images are allowed. Got: " + contentType);
        }
    }

    /**
     * Determines the safe file extension based on MIME type — never trusts the
     * original filename extension from the client (prevents extension spoofing).
     */
    private String getSafeExtension(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) return "jpg";
        switch (contentType.toLowerCase()) {
            case "image/jpeg": return "jpg";
            case "image/png":  return "png";
            case "image/gif":  return "gif";
            case "image/webp": return "webp";
            default: return "jpg";
        }
    }
}
