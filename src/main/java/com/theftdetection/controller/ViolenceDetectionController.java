package com.theftdetection.controller;

import com.theftdetection.entity.VideoRecord;
import com.theftdetection.service.CameraStreamingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/violence-detection")
@CrossOrigin(origins = "*")
public class ViolenceDetectionController {

    @Autowired
    private CameraStreamingService cameraService;

    @GetMapping("/results")
    public ResponseEntity<List<VideoRecord>> getViolenceDetectionResults() {
        List<VideoRecord> videos = cameraService.getAllVideos();
        List<VideoRecord> violenceVideos = videos.stream()
                .filter(video -> video.getViolenceDetected() != null && video.getViolenceDetected())
                .collect(Collectors.toList());
        return ResponseEntity.ok(violenceVideos);
    }
}
