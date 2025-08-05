package com.theftdetection.repository;

import com.theftdetection.entity.CameraSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CameraSessionRepository extends JpaRepository<CameraSession, Long> {
    
    Optional<CameraSession> findBySessionId(String sessionId);
    
    List<CameraSession> findByDeviceId(String deviceId);
    
    List<CameraSession> findByIsActive(Boolean isActive);
    
    @Query("SELECT cs FROM CameraSession cs WHERE cs.isActive = true")
    List<CameraSession> findActiveSessions();
    
    @Query("SELECT cs FROM CameraSession cs WHERE cs.deviceId = ?1 AND cs.isActive = true")
    Optional<CameraSession> findActiveSessionByDeviceId(String deviceId);
}