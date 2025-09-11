package com.theftdetection.repository;

import com.theftdetection.entity.Screenshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScreenshotRepository extends JpaRepository<Screenshot, Long> {
    
    List<Screenshot> findByDeviceId(String deviceId);
    
    List<Screenshot> findBySessionId(String sessionId);
    
    List<Screenshot> findByCapturedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT s FROM Screenshot s WHERE s.deviceId = ?1 ORDER BY s.capturedAt DESC")
    List<Screenshot> findByDeviceIdOrderByCapturedAtDesc(String deviceId);
    
    @Query("SELECT s FROM Screenshot s ORDER BY s.capturedAt DESC")
    List<Screenshot> findAllOrderByCapturedAtDesc();
}