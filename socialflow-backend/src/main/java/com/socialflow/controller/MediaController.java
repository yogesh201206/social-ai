package com.socialflow.controller;

import com.socialflow.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final MediaStorageService mediaStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "purpose", defaultValue = "temp") String purpose,
            @RequestParam(value = "platform", defaultValue = "general") String platform
    ) {
        boolean isScheduled = "scheduled".equalsIgnoreCase(purpose);
        MediaStorageService.StoredMediaResult result = isScheduled
                ? mediaStorageService.storeScheduledMedia(file, platform)
                : mediaStorageService.storeTempMedia(file, platform);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "url", result.publicUrl(),
                "mediaPath", result.mediaPath(),
                "fileName", result.fileName(),
                "originalFileName", result.originalFileName(),
                "contentType", result.contentType(),
                "size", result.size()
        ));
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        Resource resource = mediaStorageService.loadResource(fileName);

        String contentType = "application/octet-stream";
        try {
            if (resource.getFile() != null) {
                contentType = Files.probeContentType(resource.getFile().toPath());
            }
        } catch (IOException ignored) {}

        if (contentType == null) {
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".mp4")) contentType = "video/mp4";
            else if (lower.endsWith(".mov")) contentType = "video/quicktime";
            else if (lower.endsWith(".webm")) contentType = "video/webm";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (lower.endsWith(".png")) contentType = "image/png";
            else if (lower.endsWith(".webp")) contentType = "image/webp";
            else contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);
    }
}
