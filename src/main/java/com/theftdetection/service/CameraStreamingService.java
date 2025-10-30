package com.theftdetection.service;

import com.theftdetection.entity.CameraSession;
import com.theftdetection.entity.VideoRecord;
import com.theftdetection.entity.Screenshot;
import com.theftdetection.repository.CameraSessionRepository;
import com.theftdetection.repository.VideoRecordRepository;
import com.theftdetection.repository.ScreenshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CameraStreamingService {

    @Autowired
    private CameraSessionRepository sessionRepository;
    
    @Autowired
    private VideoRecordRepository videoRepository;
    
    @Autowired
    private ScreenshotRepository screenshotRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Value("${file.upload-dir}")
    private String uploadDir;

    public CameraSession startSession(String deviceId, String ipAddress, String userAgent, User user) {
        // End any existing active session for this device
        Optional<CameraSession> existingSession = sessionRepository.findActiveSessionByDeviceId(deviceId);
        if (existingSession.isPresent()) {
            endSession(existingSession.get().getSessionId());
        }
        
        String sessionId = UUID.randomUUID().toString();
        CameraSession session = new CameraSession(sessionId, deviceId, ipAddress, userAgent, user);
        session = sessionRepository.save(session);
        
        // Notify all connected clients about new session
        messagingTemplate.convertAndSend("/topic/sessions", session);
        
        return session;
    }

    public void endSession(String sessionId) {
        Optional<CameraSession> sessionOpt = sessionRepository.findBySessionId(sessionId);
        if (sessionOpt.isPresent()) {
            CameraSession session = sessionOpt.get();
            session.setIsActive(false);
            session.setEndTime(LocalDateTime.now());
            sessionRepository.save(session);
            
            // Notify clients about session end
            messagingTemplate.convertAndSend("/topic/sessions/ended", session);
        }
    }

    public void broadcastCameraFrame(String sessionId, String frameData) {
        // Broadcast frame to all connected clients for this session
        messagingTemplate.convertAndSend("/topic/camera/" + sessionId, frameData);
    }

    public VideoRecord saveVideoRecord(MultipartFile file, String deviceId, String sessionId, User user) throws IOException {
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, "videos");
        Files.createDirectories(uploadPath);
        
        // Generate unique filename preserving extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "video_" + System.currentTimeMillis() + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, file.getBytes());
        
        // Create database record
        CameraSession session = sessionRepository.findBySessionId(sessionId).orElseThrow(() -> new IOException("Session not found"));
        VideoRecord videoRecord = new VideoRecord(
            filename,
            filePath.toString(),
            file.getSize(),
            deviceId,
            session
        );
        // Persist MIME type from upload (e.g., video/mp4 on iOS Safari)
        if (file.getContentType() != null) {
            videoRecord.setMimeType(file.getContentType());
        }
        
        videoRecord = videoRepository.save(videoRecord);
        
        // Notify clients about new video
        messagingTemplate.convertAndSend("/topic/videos/new", videoRecord);
        
        return videoRecord;
    }

    public Screenshot saveScreenshot(MultipartFile file, String deviceId, String sessionId, User user) throws IOException {
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, "screenshots");
        Files.createDirectories(uploadPath);
        
        // Generate unique filename preserving extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "screenshot_" + System.currentTimeMillis() + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, file.getBytes());
        
        // Create database record
        CameraSession session = sessionRepository.findBySessionId(sessionId).orElseThrow(() -> new IOException("Session not found"));
        Screenshot screenshot = new Screenshot(
            filename,
            filePath.toString(),
            file.getSize(),
            deviceId,
            session
        );
        if (file.getContentType() != null) {
            screenshot.setMimeType(file.getContentType());
        }
        
        screenshot = screenshotRepository.save(screenshot);
        
        // Notify clients about new screenshot
        messagingTemplate.convertAndSend("/topic/screenshots/new", screenshot);
        
        return screenshot;
    }

    public List<CameraSession> getActiveSessions() {
        return sessionRepository.findActiveSessions();
    }

    public List<VideoRecord> getVideosByDevice(String deviceId) {
        return videoRepository.findByDeviceIdOrderByRecordedAtDesc(deviceId);
    }

    public List<Screenshot> getScreenshotsByDevice(String deviceId) {
        return screenshotRepository.findByDeviceIdOrderByCapturedAtDesc(deviceId);
    }

    public List<VideoRecord> getAllVideos() {
        return videoRepository.findAllOrderByRecordedAtDesc();
    }

    public List<Screenshot> getAllScreenshots() {
        return screenshotRepository.findAllOrderByCapturedAtDesc();
    }

    public Optional<CameraSession> getSessionById(String sessionId) {
        return sessionRepository.findBySessionId(sessionId);
    }
}