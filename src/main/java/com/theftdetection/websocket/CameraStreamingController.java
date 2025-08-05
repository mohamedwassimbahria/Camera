package com.theftdetection.websocket;

import com.theftdetection.service.CameraStreamingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class CameraStreamingController {

    @Autowired
    private CameraStreamingService cameraService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/camera/frame/{sessionId}")
    public void handleCameraFrame(@DestinationVariable String sessionId, @Payload Map<String, Object> frameData) {
        // Broadcast the frame to all subscribers of this session
        messagingTemplate.convertAndSend("/topic/camera/" + sessionId, frameData);
    }

    @MessageMapping("/camera/status/{sessionId}")
    public void handleCameraStatus(@DestinationVariable String sessionId, @Payload Map<String, Object> statusData) {
        // Broadcast camera status (connected, disconnected, error, etc.)
        messagingTemplate.convertAndSend("/topic/camera/status/" + sessionId, statusData);
    }

    @MessageMapping("/camera/signal/{sessionId}")
    public void handleWebRTCSignal(@DestinationVariable String sessionId, @Payload Map<String, Object> signalData) {
        // Handle WebRTC signaling for peer-to-peer connection
        messagingTemplate.convertAndSend("/topic/camera/signal/" + sessionId, signalData);
    }
}