package com.theftdetection.controller;

import com.theftdetection.entity.CameraSession;
import com.theftdetection.entity.VideoRecord;
import com.theftdetection.entity.Screenshot;
import com.theftdetection.service.CameraStreamingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/camera")
@CrossOrigin(origins = "*")
public class CameraController {

    @Autowired
    private CameraStreamingService cameraService;

    @PostMapping("/start-session")
    public ResponseEntity<Map<String, Object>> startSession(
            @RequestParam String deviceId,
            HttpServletRequest request) {
        
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        CameraSession session = cameraService.startSession(deviceId, ipAddress, userAgent);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("sessionId", session.getSessionId());
        response.put("message", "Camera session started successfully");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/end-session")
    public ResponseEntity<Map<String, Object>> endSession(@RequestParam String sessionId) {
        cameraService.endSession(sessionId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Camera session ended successfully");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload-video")
    public ResponseEntity<Map<String, Object>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("deviceId") String deviceId,
            @RequestParam("sessionId") String sessionId) {
        
        try {
            VideoRecord videoRecord = cameraService.saveVideoRecord(file, deviceId, sessionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("videoId", videoRecord.getId());
            response.put("fileName", videoRecord.getFileName());
            response.put("message", "Video uploaded successfully");
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to upload video: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/upload-screenshot")
    public ResponseEntity<Map<String, Object>> uploadScreenshot(
            @RequestParam("file") MultipartFile file,
            @RequestParam("deviceId") String deviceId,
            @RequestParam("sessionId") String sessionId) {
        
        try {
            Screenshot screenshot = cameraService.saveScreenshot(file, deviceId, sessionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("screenshotId", screenshot.getId());
            response.put("fileName", screenshot.getFileName());
            response.put("message", "Screenshot uploaded successfully");
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to upload screenshot: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/active-sessions")
    public ResponseEntity<List<CameraSession>> getActiveSessions() {
        List<CameraSession> sessions = cameraService.getActiveSessions();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/videos")
    public ResponseEntity<List<VideoRecord>> getAllVideos() {
        List<VideoRecord> videos = cameraService.getAllVideos();
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/videos/device/{deviceId}")
    public ResponseEntity<List<VideoRecord>> getVideosByDevice(@PathVariable String deviceId) {
        List<VideoRecord> videos = cameraService.getVideosByDevice(deviceId);
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/screenshots")
    public ResponseEntity<List<Screenshot>> getAllScreenshots() {
        List<Screenshot> screenshots = cameraService.getAllScreenshots();
        return ResponseEntity.ok(screenshots);
    }

    @GetMapping("/screenshots/device/{deviceId}")
    public ResponseEntity<List<Screenshot>> getScreenshotsByDevice(@PathVariable String deviceId) {
        List<Screenshot> screenshots = cameraService.getScreenshotsByDevice(deviceId);
        return ResponseEntity.ok(screenshots);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<CameraSession> getSession(@PathVariable String sessionId) {
        Optional<CameraSession> session = cameraService.getSessionById(sessionId);
        return session.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/download/video/{filename}")
    public ResponseEntity<Resource> downloadVideo(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("/workspace/uploads/videos").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("video/webm"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/download/screenshot/{filename}")
    public ResponseEntity<Resource> downloadScreenshot(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("/workspace/uploads/screenshots").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}