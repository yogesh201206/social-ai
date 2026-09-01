package com.socialflow.service.impl;

import com.socialflow.exception.BadRequestException;
import com.socialflow.service.MediaStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

/**
 * Implementation of MediaStorageService managing temporary and scheduled media files on disk.
 */
@Service
@Slf4j
public class MediaStorageServiceImpl implements MediaStorageService {

    @Value("${socialflow.upload.temp-dir:uploads/temp}")
    private String tempDirConfig;

    @Value("${socialflow.upload.scheduled-dir:uploads/scheduled}")
    private String scheduledDirConfig;

    private Path tempBasePath;
    private Path scheduledBasePath;

    private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of(".mp4", ".mov", ".webm");
    private static final Set<String> ALLOWED_VIDEO_MIME_TYPES = Set.of(
            "video/mp4", "video/quicktime", "video/webm", "video/x-matroska"
    );

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final Set<String> ALLOWED_IMAGE_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_VIDEO_SIZE = 100L * 1024 * 1024; // 100MB
    private static final long MAX_IMAGE_SIZE = 15L * 1024 * 1024;  // 15MB

    @PostConstruct
    public void init() {
        this.tempBasePath = Paths.get(tempDirConfig).toAbsolutePath().normalize();
        this.scheduledBasePath = Paths.get(scheduledDirConfig).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.tempBasePath);
            Files.createDirectories(this.tempBasePath.resolve("youtube"));
            Files.createDirectories(this.tempBasePath.resolve("general"));

            Files.createDirectories(this.scheduledBasePath);
            Files.createDirectories(this.scheduledBasePath.resolve("youtube"));
            Files.createDirectories(this.scheduledBasePath.resolve("general"));

            log.info("[MediaStorage] Initialized storage paths -> temp: {}, scheduled: {}",
                    this.tempBasePath, this.scheduledBasePath);
        } catch (IOException e) {
            log.error("[MediaStorage] Could not create storage directories: {}", e.getMessage());
        }
    }

    @Override
    public StoredMediaResult storeTempMedia(MultipartFile file, String platform) {
        return storeMedia(file, platform, false);
    }

    @Override
    public StoredMediaResult storeScheduledMedia(MultipartFile file, String platform) {
        return storeMedia(file, platform, true);
    }

    private StoredMediaResult storeMedia(MultipartFile file, String platform, boolean isScheduled) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        // Prevent path traversal
        if (originalName.contains("..") || originalName.contains("/") || originalName.contains("\\")) {
            originalName = Paths.get(originalName).getFileName().toString();
        }

        String extension = extractExtension(originalName);
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        boolean isVideo = ALLOWED_VIDEO_EXTENSIONS.contains(extension) || ALLOWED_VIDEO_MIME_TYPES.contains(contentType);
        boolean isImage = ALLOWED_IMAGE_EXTENSIONS.contains(extension) || ALLOWED_IMAGE_MIME_TYPES.contains(contentType);

        if (!isVideo && !isImage) {
            throw new BadRequestException("Unsupported media format. Allowed: MP4, MOV, WEBM, JPG, PNG, WEBP.");
        }

        if (isVideo && file.getSize() > MAX_VIDEO_SIZE) {
            throw new BadRequestException("Video file exceeds allowed size (maximum 100MB).");
        }
        if (isImage && file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Image file exceeds allowed size (maximum 15MB).");
        }

        // Generate safe unique filename using UUID
        String safeExt = isVideo
                ? (extension.isBlank() ? ".mp4" : extension)
                : (extension.isBlank() ? ".jpg" : extension);

        String uniqueFileName = UUID.randomUUID() + safeExt;

        String subfolder = (platform != null && !platform.isBlank())
                ? platform.toLowerCase().replaceAll("[^a-z0-9]", "")
                : "general";

        Path targetDir = isScheduled
                ? this.scheduledBasePath.resolve(subfolder)
                : this.tempBasePath.resolve(subfolder);

        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(uniqueFileName);

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = isScheduled
                    ? "uploads/scheduled/" + subfolder + "/" + uniqueFileName
                    : "uploads/temp/" + subfolder + "/" + uniqueFileName;

            log.info("[MediaStorage] Stored {} ({} bytes, isScheduled={}) -> {}",
                    originalName, file.getSize(), isScheduled, relativePath);

            return new StoredMediaResult(
                    relativePath,
                    uniqueFileName,
                    originalName,
                    isVideo ? (contentType.isBlank() ? "video/mp4" : contentType) : (contentType.isBlank() ? "image/jpeg" : contentType),
                    file.getSize(),
                    "/api/media/files/" + uniqueFileName
            );

        } catch (IOException e) {
            log.error("[MediaStorage] Error saving file {}: {}", originalName, e.getMessage());
            throw new BadRequestException("Could not save media file: " + e.getMessage());
        }
    }

    @Override
    public String promoteToScheduled(String mediaPath) {
        if (mediaPath == null || mediaPath.isBlank()) return mediaPath;
        if (!mediaPath.contains("uploads/temp/") && !mediaPath.contains("temp/")) {
            return mediaPath; // already scheduled or not temp
        }

        try {
            Path sourceFile = resolveSafePath(mediaPath);
            if (sourceFile != null && Files.exists(sourceFile)) {
                String fileName = sourceFile.getFileName().toString();
                String parentFolder = sourceFile.getParent().getFileName().toString();

                Path targetDir = this.scheduledBasePath.resolve(parentFolder);
                Files.createDirectories(targetDir);
                Path targetFile = targetDir.resolve(fileName);

                Files.move(sourceFile, targetFile, StandardCopyOption.REPLACE_EXISTING);
                String newRelativePath = "uploads/scheduled/" + parentFolder + "/" + fileName;

                log.info("[MediaStorage] Promoted media to scheduled storage: {} -> {}", mediaPath, newRelativePath);
                return newRelativePath;
            }
        } catch (Exception e) {
            log.warn("[MediaStorage] Failed to promote temp file {}: {}", mediaPath, e.getMessage());
        }
        return mediaPath;
    }

    @Override
    public boolean deleteMediaFile(String mediaPath) {
        if (mediaPath == null || mediaPath.isBlank()) return false;

        try {
            Path targetFile = resolveSafePath(mediaPath);
            if (targetFile != null && Files.exists(targetFile)) {
                Files.delete(targetFile);
                log.info("[MediaStorage] Deleted media file from disk: {}", mediaPath);
                return true;
            }
        } catch (Exception e) {
            log.warn("[MediaStorage] Could not delete media file {}: {}", mediaPath, e.getMessage());
        }
        return false;
    }

    @Override
    public byte[] loadMediaBytes(String mediaPathOrUrl) {
        if (mediaPathOrUrl == null || mediaPathOrUrl.isBlank()) return null;

        // Check if it starts with data URI
        if (mediaPathOrUrl.startsWith("data:")) {
            int comma = mediaPathOrUrl.indexOf(",");
            if (comma != -1) {
                return Base64.getDecoder().decode(mediaPathOrUrl.substring(comma + 1).trim());
            }
        }

        // Check if it's a local file path or /api/media/files/...
        Path targetFile = resolveSafePath(mediaPathOrUrl);
        if (targetFile != null && Files.exists(targetFile)) {
            try {
                return Files.readAllBytes(targetFile);
            } catch (IOException e) {
                log.warn("[MediaStorage] Error reading bytes from {}: {}", targetFile, e.getMessage());
            }
        }

        return null;
    }

    @Override
    public Resource loadResource(String fileNameOrPath) {
        Path targetFile = resolveSafePath(fileNameOrPath);
        if (targetFile == null || !Files.exists(targetFile)) {
            // Also search by filename across all subdirectories
            String simpleName = Paths.get(fileNameOrPath).getFileName().toString();
            targetFile = findFileByName(simpleName);
        }

        if (targetFile != null && Files.exists(targetFile)) {
            try {
                return new UrlResource(targetFile.toUri());
            } catch (MalformedURLException ignored) {}
        }

        throw new BadRequestException("File not found: " + fileNameOrPath);
    }

    private Path findFileByName(String fileName) {
        // Look in temp
        Path inTemp = this.tempBasePath.resolve("youtube").resolve(fileName);
        if (Files.exists(inTemp)) return inTemp;
        inTemp = this.tempBasePath.resolve("general").resolve(fileName);
        if (Files.exists(inTemp)) return inTemp;

        // Look in scheduled
        Path inSched = this.scheduledBasePath.resolve("youtube").resolve(fileName);
        if (Files.exists(inSched)) return inSched;
        inSched = this.scheduledBasePath.resolve("general").resolve(fileName);
        if (Files.exists(inSched)) return inSched;

        return null;
    }

    private Path resolveSafePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) return null;

        String clean = rawPath.replace("\\", "/");
        if (clean.contains("..")) {
            log.warn("[MediaStorage] Path traversal attempt detected: {}", rawPath);
            return null;
        }

        if (clean.contains("/api/media/files/")) {
            String fileName = clean.substring(clean.lastIndexOf("/api/media/files/") + 17);
            if (fileName.contains("?")) fileName = fileName.substring(0, fileName.indexOf("?"));
            return findFileByName(fileName);
        }

        Path path = Paths.get(clean).normalize();
        if (path.isAbsolute()) {
            if (path.startsWith(this.tempBasePath) || path.startsWith(this.scheduledBasePath)) {
                return path;
            }
            return null;
        }

        // Relative path like uploads/temp/youtube/uuid.mp4 or uploads/scheduled/youtube/uuid.mp4
        Path currentDir = Paths.get(".").toAbsolutePath().normalize();
        Path resolved = currentDir.resolve(path).normalize();

        if (resolved.startsWith(this.tempBasePath) || resolved.startsWith(this.scheduledBasePath)) {
            return resolved;
        }

        // Fallback filename lookup
        String fileName = path.getFileName().toString();
        return findFileByName(fileName);
    }

    /**
     * Scheduled cleanup job: deletes temporary files in uploads/temp older than 2 hours.
     * Never touches files in uploads/scheduled/.
     */
    @Scheduled(fixedDelay = 3600_000) // Runs every hour
    public void cleanupAbandonedTempFiles() {
        if (this.tempBasePath == null || !Files.exists(this.tempBasePath)) return;

        Instant cutoff = Instant.now().minus(2, ChronoUnit.HOURS);
        log.debug("[MediaStorage] Running cleanup for abandoned temp files older than: {}", cutoff);

        try {
            Files.walkFileTree(this.tempBasePath, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    if (attrs.isRegularFile() && attrs.lastModifiedTime().toInstant().isBefore(cutoff)) {
                        try {
                            Files.delete(file);
                            log.info("[MediaStorage] Cleaned up expired temporary file: {}", file);
                        } catch (Exception e) {
                            log.warn("[MediaStorage] Could not delete expired temp file {}: {}", file, e.getMessage());
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            log.warn("[MediaStorage] Error during temp files cleanup: {}", e.getMessage());
        }
    }

    private String extractExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            return filename.substring(dot).toLowerCase().replaceAll("[^a-z0-9.]", "");
        }
        return "";
    }
}
