package com.theftdetection.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_records")
public class VideoRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "file_name", nullable = false)
    private String fileName;
    
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "duration")
    private Integer duration; // in seconds
    
    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;
    
    @Column(name = "device_id")
    private String deviceId;
    
    @Column(name = "mime_type")
    private String mimeType;
    
    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    @Column(name = "violence_detected")
    private Boolean violenceDetected;

    @ManyToOne
    @JoinColumn(name = "camera_session_id")
    private CameraSession cameraSession;
    
    // Constructors
    public VideoRecord() {}
    
    public VideoRecord(String fileName, String filePath, Long fileSize, String deviceId, CameraSession cameraSession) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.deviceId = deviceId;
        this.cameraSession = cameraSession;
        this.recordedAt = LocalDateTime.now();
        this.mimeType = "video/webm";
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    
    public String getThumbnailPath() { return thumbnailPath; }
    public void setThumbnailPath(String thumbnailPath) { this.thumbnailPath = thumbnailPath; }

    public Boolean getViolenceDetected() { return violenceDetected; }
    public void setViolenceDetected(Boolean violenceDetected) { this.violenceDetected = violenceDetected; }

    public CameraSession getCameraSession() { return cameraSession; }
    public void setCameraSession(CameraSession cameraSession) { this.cameraSession = cameraSession; }
}