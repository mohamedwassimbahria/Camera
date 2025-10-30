package com.theftdetection.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "camera_sessions")
public class CameraSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;
    
    @Column(name = "device_id")
    private String deviceId;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "cameraSession")
    private List<Screenshot> screenshots;

    @OneToMany(mappedBy = "cameraSession")
    private List<VideoRecord> videoRecords;
    
    // Constructors
    public CameraSession() {}
    
    public CameraSession(String sessionId, String deviceId, String ipAddress, String userAgent, User user) {
        this.sessionId = sessionId;
        this.deviceId = deviceId;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.startTime = LocalDateTime.now();
        this.isActive = true;
        this.user = user;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public List<Screenshot> getScreenshots() { return screenshots; }
    public void setScreenshots(List<Screenshot> screenshots) { this.screenshots = screenshots; }

    public List<VideoRecord> getVideoRecords() { return videoRecords; }
    public void setVideoRecords(List<VideoRecord> videoRecords) { this.videoRecords = videoRecords; }
}