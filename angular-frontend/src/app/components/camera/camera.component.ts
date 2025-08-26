import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, CameraSession } from '../../services/camera.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  
  deviceId: string = 'mobile-device-' + Math.random().toString(36).substr(2, 9);
  isCameraActive: boolean = false;
  isRecording: boolean = false;
  isLoading: boolean = false;
  recordingTime: number = 0;
  currentSession: CameraSession | null = null;
  recentMedia: any[] = [];
  
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordingInterval: any;
  private recordedChunks: Blob[] = [];
  private subscriptions: Subscription[] = [];

  // New state for device selection and viewing
  videoInputDevices: MediaDeviceInfo[] = [];
  selectedDeviceId: string | null = null;
  viewingSessionId: string = '';
  isViewing: boolean = false;
  latestFrameSrc: string | null = null;
  latestFrameSafeUrl: SafeUrl | null = null;
  remoteDeviceId: string | null = null;

  // Viewer-side recording state
  private viewerCanvas: HTMLCanvasElement | null = null;
  private viewerCtx: CanvasRenderingContext2D | null = null;
  private viewerStream: MediaStream | null = null;
  private viewerRecorder: MediaRecorder | null = null;
  private viewerChunks: Blob[] = [];
  private pendingFrameImg: HTMLImageElement | null = null;
  
  private get isIOS(): boolean {
    const ua = navigator.userAgent || navigator.vendor;
    return /iPad|iPhone|iPod/.test(ua);
  }
  
  constructor(private cameraService: CameraService, private ngZone: NgZone, private sanitizer: DomSanitizer) {}
  
  ngOnInit(): void {
    this.cameraService.connectWebSocket();
    
    // Subscribe to WebSocket connection status
    this.subscriptions.push(
      this.cameraService.isConnected$.subscribe(connected => {
        console.log('WebSocket connection status:', connected);
      })
    );
    
    // Subscribe to current session
    this.subscriptions.push(
      this.cameraService.currentSession$.subscribe(session => {
        this.currentSession = session;
      })
    );

    // Subscribe to incoming frames for viewing mode
    this.subscriptions.push(
      this.cameraService.cameraFrame$.subscribe(framePayload => {
        if (!this.isCameraActive && this.isViewing && framePayload?.frame) {
          this.ngZone.run(() => {
            const raw = framePayload.frame as string;
            this.latestFrameSrc = raw;
            this.latestFrameSafeUrl = this.sanitizer.bypassSecurityTrustUrl(raw);
            // If viewer-side recording is active, draw frame into offscreen canvas
            if (this.viewerCtx && this.viewerCanvas) {
              const img = new Image();
              img.onload = () => {
                try {
                  if (!this.viewerCanvas) return;
                  if (this.viewerCanvas.width === 0 || this.viewerCanvas.height === 0) {
                    this.viewerCanvas.width = img.width;
                    this.viewerCanvas.height = img.height;
                  }
                  this.viewerCtx!.drawImage(img, 0, 0, this.viewerCanvas.width, this.viewerCanvas.height);
                } catch {}
              };
              img.src = raw;
              this.pendingFrameImg = img;
            }
          });
        }
      })
    );

    // Subscribe to incoming commands for remote control
    this.subscriptions.push(
      this.cameraService.cameraCommand$.subscribe(commandPayload => {
        if (this.isCameraActive && commandPayload?.command) {
          this.handleRemoteCommand(commandPayload.command);
        }
      })
    );

    // Listen to new media events to reflect uploads immediately
    this.subscriptions.push(
      this.cameraService.newVideo$.subscribe(video => {
        if (!video) return;
        // Show only if it belongs to current session/device
        const matches = (this.currentSession && video.sessionId === this.currentSession.sessionId) ||
                        (this.isViewing && this.viewingSessionId && video.sessionId === this.viewingSessionId);
        if (matches && !this.recentMedia.find(m => m.fileName === video.fileName)) {
          this.recentMedia.unshift({ type: 'video', fileName: video.fileName, url: this.cameraService.downloadVideo(video.fileName) });
        }
      })
    );
    this.subscriptions.push(
      this.cameraService.newScreenshot$.subscribe(shot => {
        if (!shot) return;
        const matches = (this.currentSession && shot.sessionId === this.currentSession.sessionId) ||
                        (this.isViewing && this.viewingSessionId && shot.sessionId === this.viewingSessionId);
        if (matches && !this.recentMedia.find(m => m.fileName === shot.fileName)) {
          this.recentMedia.unshift({ type: 'screenshot', fileName: shot.fileName, url: this.cameraService.downloadScreenshot(shot.fileName) });
        }
      })
    );

    // Try to populate available devices (will require permission for labels)
    this.refreshDevices();
  }
  
  ngOnDestroy(): void {
    this.stopCamera();
    this.cameraService.disconnectWebSocket();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  async startCamera(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Request camera permission and get stream
      const videoConstraints: MediaTrackConstraints = this.selectedDeviceId
        ? { deviceId: { exact: this.selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' };
      
      // On iOS, avoid requesting microphone initially to reduce permission friction
      const wantAudio = !this.isIOS;
      
      // Primary attempt
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: wantAudio
        });
      } catch (primaryError: any) {
        // Fallbacks: relax constraints and/or drop audio entirely
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          });
        } catch (fallbackEnvError: any) {
          // Final fallback: generic camera
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }
      
      // Set video source
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      try {
        await this.videoElement.nativeElement.play();
      } catch {}
      
      // Refresh devices after permission to get labels
      await this.refreshDevices();
      
      // Start camera session
      this.cameraService.startSession(this.deviceId).subscribe({
        next: (response) => {
          this.currentSession = {
            id: 0,
            sessionId: response.sessionId,
            deviceId: this.deviceId,
            startTime: new Date().toISOString(),
            isActive: true,
            ipAddress: '',
            userAgent: navigator.userAgent
          };
          
          this.cameraService.setCurrentSession(this.currentSession);
          this.cameraService.subscribeToSession(response.sessionId);
          this.isCameraActive = true;
          this.isViewing = false;
          this.latestFrameSrc = null;
          this.latestFrameSafeUrl = null;
          this.startFrameStreaming();
        },
        error: (error) => {
          console.error('Error starting camera session:', error);
          this.stopMediaStream();
          this.isLoading = false;
          alert('Could not start camera session. Ensure the backend is running on port 8080 and reachable.');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.isLoading = false;
      // Provide actionable guidance, especially for iOS and insecure contexts
      const secureHint = (!window.isSecureContext && this.isIOS)
        ? '\nTip: On iPhone, use HTTPS (e.g., ng serve --ssl) and accept the certificate.'
        : '';
      alert('Could not access camera. Please ensure camera permissions are granted on your device and the camera is not in use by another app.' + secureHint);
    }
  }
  
  stopCamera(): void {
    this.stopRecording();
    this.stopMediaStream();
    
    if (this.currentSession) {
      this.cameraService.endSession(this.currentSession.sessionId).subscribe({
        next: () => {
          console.log('Camera session ended');
        },
        error: (error) => {
          console.error('Error ending session:', error);
        }
      });
    }
    
    this.isCameraActive = false;
    this.currentSession = null;
    this.cameraService.setCurrentSession(null);
  }

  // Unified stop action for local camera or remote session
  stopAction(): void {
    if (this.isViewing && this.viewingSessionId) {
      this.sendCommand('END_SESSION');
      this.leaveViewing();
      return;
    }
    if (this.isCameraActive) {
      this.stopCamera();
    }
  }

  async refreshDevices(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        this.videoInputDevices = [];
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.videoInputDevices = devices.filter(d => d.kind === 'videoinput');
    } catch (e) {
      console.warn('Could not enumerate devices:', e);
    }
  }

  joinViewing(): void {
    if (!this.viewingSessionId) return;
    // Show a quick loading state; disable actions until first frame
    this.isLoading = true;
    this.cameraService.unsubscribeFromCurrent();
    this.isViewing = true;
    this.isCameraActive = false;
    // Clear stale preview until first frame arrives
    this.latestFrameSrc = null;
    this.latestFrameSafeUrl = null;
    this.cameraService.subscribeToSession(this.viewingSessionId).then(() => {
      // Stop loading after subscription; first frame will display soon after
      this.isLoading = false;
    });
    // Fetch remote deviceId for attribution
    this.cameraService.getSession(this.viewingSessionId).subscribe({
      next: (s) => { this.remoteDeviceId = s.deviceId; },
      error: () => { this.remoteDeviceId = null; }
    });
  }

  leaveViewing(): void {
    this.isViewing = false;
    this.latestFrameSrc = null;
    this.latestFrameSafeUrl = null;
    this.cameraService.unsubscribeFromCurrent();
    this.stopViewerRecording();
  }

  sendCommand(command: string): void {
    if (this.isViewing && this.viewingSessionId) {
      console.log(`Sending remote command: ${command}`);
      this.cameraService.sendControlCommand(this.viewingSessionId, command);
    }
  }

  private handleRemoteCommand(command: string): void {
    console.log(`Received remote command: ${command}`);
    switch (command) {
      case 'TOGGLE_RECORDING':
        // If this device is the camera, perform local record toggle
        if (this.isCameraActive) {
          this.toggleRecording();
        }
        break;
      case 'TAKE_SCREENSHOT':
        if (this.isCameraActive) {
          this.takeScreenshot();
        }
        break;
      case 'END_SESSION':
        if (this.isCameraActive) {
          this.stopCamera();
        }
        break;
    }
  }
  
  private stopMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
  
  private startFrameStreaming(): void {
    // Stream frames via WebSocket for real-time viewing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const streamFrame = () => {
      if (!this.isCameraActive || !this.videoElement?.nativeElement) return;
      
      const video = this.videoElement.nativeElement;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setTimeout(streamFrame, 200);
        return;
      }
      
      // Downscale to reduce payload size for SockJS/STOMP
      const targetWidth = 480;
      const scale = targetWidth / video.videoWidth;
      const targetHeight = Math.round(video.videoHeight * scale);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const frameData = canvas.toDataURL('image/jpeg', 0.5);
      
      if (this.currentSession) {
        this.cameraService.sendCameraFrame(this.currentSession.sessionId, {
          frame: frameData,
          timestamp: Date.now()
        });
      }
      
      if (this.isCameraActive) {
        setTimeout(streamFrame, 200); // ~5 FPS
      }
    };
    
    const videoEl = this.videoElement.nativeElement;
    const startIfReady = () => {
      if (!this.isCameraActive) return;
      streamFrame();
    };
    
    if (videoEl.readyState >= 1) {
      startIfReady();
    }
    videoEl.addEventListener('loadedmetadata', startIfReady, { once: true });
  }
  
  toggleRecording(): void {
    if (this.isViewing && !this.isCameraActive) {
      // Prefer viewer-side recording to guarantee DB persistence even if phone cannot record
      if (!this.isRecording) {
        this.startViewerRecording();
      } else {
        this.stopViewerRecording();
      }
      return;
    }
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }
  
  private startViewerRecording(): void {
    if (!this.latestFrameSrc || !this.viewingSessionId) {
      alert('Waiting for frames from remote camera...');
      return;
    }
    try {
      this.viewerCanvas = document.createElement('canvas');
      this.viewerCtx = this.viewerCanvas.getContext('2d');
      // Initialize size using current frame
      const img = new Image();
      img.onload = () => {
        if (!this.viewerCanvas) return;
        this.viewerCanvas.width = img.width;
        this.viewerCanvas.height = img.height;
      };
      img.src = this.latestFrameSrc;
      this.viewerStream = this.viewerCanvas.captureStream(5);
      this.viewerChunks = [];
      // Choose supported mime
      const candidates = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
      let chosen: string | undefined;
      for (const t of candidates) {
        // @ts-ignore
        if ((MediaRecorder as any).isTypeSupported && (MediaRecorder as any).isTypeSupported(t)) { chosen = t; break; }
      }
      this.viewerRecorder = new MediaRecorder(this.viewerStream, chosen ? { mimeType: chosen } as any : undefined as any);
      this.viewerRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) this.viewerChunks.push(ev.data); };
      this.viewerRecorder.onstop = () => { this.saveViewerRecording(); };
      this.viewerRecorder.start();
      this.isRecording = true;
      this.recordingTime = 0;
      this.recordingInterval = setInterval(() => { this.recordingTime++; }, 1000);
    } catch (e) {
      console.error('Failed to start viewer recording', e);
      alert('Recording not supported in this browser.');
    }
  }
  
  private stopViewerRecording(): void {
    if (this.viewerRecorder && this.isRecording) {
      this.viewerRecorder.stop();
    }
    this.isRecording = false;
    if (this.recordingInterval) { clearInterval(this.recordingInterval); this.recordingInterval = null; }
  }
  
  private saveViewerRecording(): void {
    if (this.viewerChunks.length === 0 || !this.viewingSessionId) return;
    const mime = this.viewerRecorder && (this.viewerRecorder as any).mimeType || this.viewerChunks[0]?.type || 'video/webm';
    const blob = new Blob(this.viewerChunks, { type: mime });
    const ext = mime.includes('webm') ? 'webm' : 'mp4';
    const file = new File([blob], `viewer_recording_${Date.now()}.${ext}`, { type: mime });
    const deviceIdForUpload = this.remoteDeviceId || 'remote-viewer';
    this.cameraService.uploadVideo(file, deviceIdForUpload, this.viewingSessionId).subscribe({
      next: () => {},
      error: (err) => { console.error('Viewer recording upload failed', err); }
    });
    // cleanup
    this.viewerChunks = [];
    this.viewerRecorder = null;
    if (this.viewerStream) { this.viewerStream.getTracks().forEach(t => t.stop()); this.viewerStream = null; }
    this.viewerCanvas = null; this.viewerCtx = null;
    this.recordingTime = 0;
  }
  
  private startRecording(): void {
    if (!this.mediaStream) return;
    
    this.recordedChunks = [];
    
    try {
      // Pick a MIME type supported by the current browser (Safari iOS prefers MP4/H264)
      const preferredTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264',
        'video/mp4'
      ];
      let chosenType: string | undefined = undefined;
      for (const t of preferredTypes) {
        // @ts-ignore
        if (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported && (MediaRecorder as any).isTypeSupported(t)) {
          chosenType = t;
          break;
        }
      }
      const options = chosenType ? { mimeType: chosenType } : undefined as any;
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingTime = 0;
      
      // Update recording time
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }
  
  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
    }
  }
  
  private saveRecording(): void {
    if (this.recordedChunks.length === 0 || !this.currentSession) return;
    
    const mimeFromRecorder = this.mediaRecorder && (this.mediaRecorder as any).mimeType || this.recordedChunks[0]?.type || 'video/webm';
    const ext = mimeFromRecorder.includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob(this.recordedChunks, { type: mimeFromRecorder });
    const file = new File([blob], `recording_${Date.now()}.${ext}`, { type: mimeFromRecorder });
    
    this.cameraService.uploadVideo(file, this.deviceId, this.currentSession.sessionId).subscribe({
      next: (response) => {
        console.log('Video uploaded successfully:', response);
        this.recentMedia.unshift({
          type: 'video',
          fileName: response.fileName,
          url: this.cameraService.downloadVideo(response.fileName)
        });
      },
      error: (error) => {
        console.error('Error uploading video:', error);
      }
    });
    
    this.recordingTime = 0;
  }
  
  takeScreenshot(): void {
    // If this device is the viewer (not camera), send command to remote
    if (!this.isCameraActive && this.isViewing && this.viewingSessionId) {
      // Prefer viewer-side upload using latest frame for reliability
      if (!this.latestFrameSrc) { alert('Waiting for a frame from remote camera...'); return; }
      const blob = this.dataUrlToBlob(this.latestFrameSrc);
      const file = new File([blob], `viewer_screenshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const deviceIdForUpload = this.remoteDeviceId || 'remote-viewer';
      this.cameraService.uploadScreenshot(file, deviceIdForUpload, this.viewingSessionId).subscribe({
        next: () => {},
        error: (err) => { console.error('Viewer screenshot upload failed', err); }
      });
      return;
    }
    if (!this.videoElement?.nativeElement || !this.currentSession) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const video = this.videoElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
        
        this.cameraService.uploadScreenshot(file, this.deviceId, this.currentSession!.sessionId).subscribe({
          next: (response) => {
            console.log('Screenshot uploaded successfully:', response);
            this.recentMedia.unshift({
              type: 'screenshot',
              fileName: response.fileName,
              url: this.cameraService.downloadScreenshot(response.fileName)
            });
          },
          error: (error) => {
            console.error('Error uploading screenshot:', error);
          }
        });
      }
    }, 'image/png');
  }
  
  private dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], { type: mime });
  }
  
  getStatusClass(): string {
    if (this.isRecording) return 'status-recording';
    if (this.isCameraActive || this.isViewing) return 'status-connected';
    return 'status-disconnected';
  }
  
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  getMediaUrl(media: any): string {
    return media.url;
  }
}

