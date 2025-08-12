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
  template: `
    <div class="row">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <span class="status-indicator" [class]="getStatusClass()"></span>
              Camera Stream
            </h5>
            <div class="device-info" *ngIf="currentSession">
              Device: {{ currentSession.deviceId }} | Session: {{ currentSession.sessionId.substring(0, 8) }}...
            </div>
          </div>
          <div class="card-body">
            <div class="video-container">
              <video 
                #videoElement 
                class="video-stream" 
                autoplay 
                muted 
                playsinline
                [style.display]="isCameraActive ? 'block' : 'none'">
              </video>
              <img *ngIf="!isCameraActive && isViewing && latestFrameSafeUrl" 
                   [src]="latestFrameSafeUrl" 
                   class="video-stream" 
                   [alt]="'Remote session ' + viewingSessionId">
              <div *ngIf="!isCameraActive && (!isViewing || !latestFrameSrc)" class="d-flex justify-content-center align-items-center" style="height: 300px; background: #f8f9fa;">
                <div class="text-center">
                  <i class="bi bi-camera-video-off" style="font-size: 3rem; color: #6c757d;"></i>
                  <p class="mt-3 text-muted">Camera not active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Camera Controls</h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button 
                class="btn btn-primary" 
                (click)="startCamera()"
                [disabled]="isCameraActive || isLoading || isViewing">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i class="bi bi-camera"></i> Start Camera
              </button>
              
              <button 
                class="btn btn-danger" 
                (click)="stopCamera()"
                [disabled]="!isCameraActive">
                <i class="bi bi-camera-video-off"></i> Stop Camera
              </button>
              
              <hr>

              <div class="mb-2">
                <label class="form-label">Video input device</label>
                <div class="input-group">
                  <select class="form-select" [(ngModel)]="selectedDeviceId" [disabled]="isCameraActive || isViewing">
                    <option [ngValue]="null">Default camera</option>
                    <option *ngFor="let d of videoInputDevices" [value]="d.deviceId">{{ d.label || 'Camera ' + d.deviceId.substring(0,6) }}</option>
                  </select>
                  <button class="btn btn-outline-secondary" type="button" (click)="refreshDevices()" [disabled]="isCameraActive || isViewing">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
                <small class="text-muted">Use this to pick a virtual iPhone webcam (e.g., DroidCam/Iriun) on desktop.</small>
              </div>
              
              <hr>
              
              <button 
                class="btn btn-success" 
                (click)="isViewing ? sendCommand('TOGGLE_RECORDING') : toggleRecording()"
                [disabled]="(!isCameraActive && !isViewing) || isLoading">
                <span class="status-indicator" [class]="isRecording ? 'status-recording' : ''"></span>
                <i class="bi" [class]="isRecording ? 'bi-stop-circle' : 'bi-record-circle'"></i>
                {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
              </button>
              
              <button 
                class="btn btn-info" 
                (click)="isViewing ? sendCommand('TAKE_SCREENSHOT') : takeScreenshot()"
                [disabled]="(!isCameraActive && !isViewing) || isLoading">
                <i class="bi bi-camera"></i> Take Screenshot
              </button>
            </div>
            
            <div class="mt-4" *ngIf="recordingTime > 0">
              <div class="alert alert-info">
                <i class="bi bi-record-circle text-danger"></i>
                Recording: {{ formatTime(recordingTime) }}
              </div>
            </div>
            
            <div class="mt-4">
              <label for="deviceId" class="form-label">Device ID:</label>
              <input 
                type="text" 
                class="form-control" 
                id="deviceId"
                [(ngModel)]="deviceId" 
                placeholder="Enter device identifier"
                [disabled]="isCameraActive || isViewing">
            </div>

            <div class="mt-4 p-3 border rounded">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">View-only session</label>
                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="leaveViewing()" [disabled]="!isViewing">Leave</button>
              </div>
              <div class="input-group">
                <input type="text" class="form-control" placeholder="Enter session ID to view" [(ngModel)]="viewingSessionId" [disabled]="isCameraActive">
                <button class="btn btn-outline-primary" type="button" (click)="joinViewing()" [disabled]="isCameraActive || !viewingSessionId || isLoading">
                  Join
                </button>
              </div>
              <small class="text-muted">Open this app on your iPhone, press Start Camera, then enter that session ID here to view.</small>
            </div>
          </div>
        </div>
        
        <div class="card mt-3" *ngIf="recentMedia.length > 0">
          <div class="card-header">
            <h6 class="mb-0">Recent Captures</h6>
          </div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col-6" *ngFor="let media of recentMedia">
                <div class="position-relative">
                  <img *ngIf="media.type === 'screenshot'" 
                       [src]="getMediaUrl(media)" 
                       class="thumbnail w-100" 
                       [alt]="media.fileName">
                  <video *ngIf="media.type === 'video'" 
                         class="thumbnail w-100" 
                         controls>
                    <source [src]="getMediaUrl(media)" type="video/webm">
                  </video>
                  <small class="text-muted d-block mt-1">{{ media.fileName }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-container {
      position: relative;
      background: #000;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .video-stream {
      width: 100%;
      height: auto;
      max-height: 500px;
    }
    
    .thumbnail {
      height: 80px;
      object-fit: cover;
      border-radius: 5px;
    }
    
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .status-connected {
      background: #28a745;
      box-shadow: 0 0 8px #28a745;
    }
    
    .status-disconnected {
      background: #dc3545;
    }
    
    .status-recording {
      background: #ff6b35;
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `]
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
  }

  leaveViewing(): void {
    this.isViewing = false;
    this.latestFrameSrc = null;
    this.latestFrameSafeUrl = null;
    this.cameraService.unsubscribeFromCurrent();
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
        this.toggleRecording();
        break;
      case 'TAKE_SCREENSHOT':
        this.takeScreenshot();
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
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }
  
  private startRecording(): void {
    if (!this.mediaStream) return;
    
    this.recordedChunks = [];
    
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
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
    
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'video/webm' });
    
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