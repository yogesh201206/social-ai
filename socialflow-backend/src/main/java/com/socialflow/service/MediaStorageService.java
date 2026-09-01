package com.socialflow.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface managing temporary and scheduled local media storage.
 */
public interface MediaStorageService {

    /**
     * Stores an uploaded file temporarily (for Post Now flow or initial draft).
     */
    StoredMediaResult storeTempMedia(MultipartFile file, String platform);

    /**
     * Stores an uploaded file in scheduled storage (persisted until publish time).
     */
    StoredMediaResult storeScheduledMedia(MultipartFile file, String platform);

    /**
     * If a media file was initially stored in uploads/temp/, moves it to uploads/scheduled/.
     */
    String promoteToScheduled(String mediaPath);

    /**
     * Safely deletes a media file from disk (temp or scheduled).
     */
    boolean deleteMediaFile(String mediaPath);

    /**
     * Loads raw binary bytes of media file from disk or URL.
     */
    byte[] loadMediaBytes(String mediaPathOrUrl);

    /**
     * Serves a file as a Resource for streaming in browsers.
     */
    Resource loadResource(String fileNameOrPath);

    record StoredMediaResult(
            String mediaPath,
            String fileName,
            String originalFileName,
            String contentType,
            long size,
            String publicUrl
    ) {}
}
