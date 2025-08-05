import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface CameraSession {
  id: number;
  sessionId: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  ipAddress: string;
  userAgent: string;
}

export interface VideoRecord {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  duration?: number;
  recordedAt: string;
  deviceId: string;
  sessionId: string;
  mimeType: string;
  thumbnailPath?: string;
}

export interface Screenshot {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  capturedAt: string;
  deviceId: string;
  sessionId: string;
  mimeType: string;
  width?: number;
  height?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private apiUrl = 'http://localhost:8080/api/camera';
  private wsUrl = 'http://localhost:8080/ws';
  
  private stompClient: Client | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private currentSessionSubject = new BehaviorSubject<CameraSession | null>(null);
  private cameraFrameSubject = new BehaviorSubject<any>(null);
  
  public isConnected$ = this.isConnectedSubject.asObservable();
  public currentSession$ = this.currentSessionSubject.asObservable();
  public cameraFrame$ = this.cameraFrameSubject.asObservable();

  constructor(private http: HttpClient) {}

  connectWebSocket(): void {
    if (this.stompClient?.connected) {
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      debug: (str) => console.log('STOMP: ' + str),
      onConnect: () => {
        console.log('WebSocket Connected');
        this.isConnectedSubject.next(true);
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        this.isConnectedSubject.next(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Error: ', frame);
      }
    });

    this.stompClient.activate();
  }

  disconnectWebSocket(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  subscribeToSession(sessionId: string): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    // Subscribe to camera frames for this session
    this.stompClient.subscribe(`/topic/camera/${sessionId}`, (message) => {
      const frameData = JSON.parse(message.body);
      this.cameraFrameSubject.next(frameData);
    });
  }

  sendCameraFrame(sessionId: string, frameData: any): void {
    if (!this.stompClient?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.stompClient.publish({
      destination: `/app/camera/frame/${sessionId}`,
      body: JSON.stringify(frameData)
    });
  }

  startSession(deviceId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/start-session`, null, {
      params: { deviceId }
    });
  }

  endSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/end-session`, null, {
      params: { sessionId }
    });
  }

  uploadVideo(file: File, deviceId: string, sessionId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deviceId', deviceId);
    formData.append('sessionId', sessionId);

    return this.http.post(`${this.apiUrl}/upload-video`, formData);
  }

  uploadScreenshot(file: File, deviceId: string, sessionId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deviceId', deviceId);
    formData.append('sessionId', sessionId);

    return this.http.post(`${this.apiUrl}/upload-screenshot`, formData);
  }

  getActiveSessions(): Observable<CameraSession[]> {
    return this.http.get<CameraSession[]>(`${this.apiUrl}/active-sessions`);
  }

  getAllVideos(): Observable<VideoRecord[]> {
    return this.http.get<VideoRecord[]>(`${this.apiUrl}/videos`);
  }

  getAllScreenshots(): Observable<Screenshot[]> {
    return this.http.get<Screenshot[]>(`${this.apiUrl}/screenshots`);
  }

  getVideosByDevice(deviceId: string): Observable<VideoRecord[]> {
    return this.http.get<VideoRecord[]>(`${this.apiUrl}/videos/device/${deviceId}`);
  }

  getScreenshotsByDevice(deviceId: string): Observable<Screenshot[]> {
    return this.http.get<Screenshot[]>(`${this.apiUrl}/screenshots/device/${deviceId}`);
  }

  getSession(sessionId: string): Observable<CameraSession> {
    return this.http.get<CameraSession>(`${this.apiUrl}/session/${sessionId}`);
  }

  downloadVideo(filename: string): string {
    return `${this.apiUrl}/download/video/${filename}`;
  }

  downloadScreenshot(filename: string): string {
    return `${this.apiUrl}/download/screenshot/${filename}`;
  }

  setCurrentSession(session: CameraSession | null): void {
    this.currentSessionSubject.next(session);
  }
}