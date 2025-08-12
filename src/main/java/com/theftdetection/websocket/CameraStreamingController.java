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
        try {
            Object frame = frameData.get("frame");
            if (frame instanceof String) {
                int len = ((String) frame).length();
                if (len > 0) {
                    System.out.println("Received frame for session " + sessionId + ", size=" + len);
                }
            }
        } catch (Exception ignored) {}
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

    @MessageMapping("/camera/command/{sessionId}")
    public void handleCameraCommand(@DestinationVariable String sessionId, @Payload Map<String, Object> command) {
        // Broadcast the command to the specific camera session to be handled by the device.
        // e.g., { "command": "TOGGLE_RECORDING" } or { "command": "TAKE_SCREENSHOT" }
        System.out.println("Received command for session " + sessionId + ": " + command.get("command"));
        messagingTemplate.convertAndSend("/topic/camera/command/" + sessionId, command);
    }
}