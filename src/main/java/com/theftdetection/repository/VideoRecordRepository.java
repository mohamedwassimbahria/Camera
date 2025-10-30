package com.theftdetection.repository;

import com.theftdetection.entity.VideoRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VideoRecordRepository extends JpaRepository<VideoRecord, Long> {
    
    List<VideoRecord> findByCameraSession(CameraSession cameraSession);
    
    List<VideoRecord> findByRecordedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT vr FROM VideoRecord vr WHERE vr.cameraSession.user.username = ?1 ORDER BY vr.recordedAt DESC")
    List<VideoRecord> findByUserUsernameOrderByRecordedAtDesc(String username);
    
    @Query("SELECT vr FROM VideoRecord vr ORDER BY vr.recordedAt DESC")
    List<VideoRecord> findAllOrderByRecordedAtDesc();
}