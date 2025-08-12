import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

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
  private apiUrl = `/api/camera`;
  private wsUrl = `${window.location.origin}/ws`;
  
  private stompClient: Client | null = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private currentSessionSubject = new BehaviorSubject<CameraSession | null>(null);
  private cameraFrameSubject = new BehaviorSubject<any>(null);
  private cameraCommandSubject = new BehaviorSubject<any>(null);
  private currentSubscribedSessionId: string | null = null;
  private currentFrameSubscription: any | null = null;
  private currentCommandSubscription: any | null = null;
  
  public isConnected$ = this.isConnectedSubject.asObservable();
  public currentSession$ = this.currentSessionSubject.asObservable();
  public cameraFrame$ = this.cameraFrameSubject.asObservable();
  public cameraCommand$ = this.cameraCommandSubject.asObservable();

  constructor(private http: HttpClient) {}

  private connectionPromise: Promise<void> | null = null;

  connectWebSocket(): void {
    if (this.stompClient?.connected) {
      return;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = new Promise<void>((resolve) => {
        this.stompClient = new Client({
          webSocketFactory: () => new SockJS(this.wsUrl),
          // Attempt quick auto-reconnects for better UX when switching/joining
          reconnectDelay: 2000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: (str) => console.log('STOMP: ' + str),
          onConnect: () => {
            console.log('WebSocket Connected');
            this.isConnectedSubject.next(true);
            resolve();
          },
          onDisconnect: () => {
            console.log('WebSocket Disconnected');
            this.isConnectedSubject.next(false);
            this.connectionPromise = null;
          },
          onStompError: (frame) => {
            console.error('STOMP Error: ', frame);
            this.isConnectedSubject.next(false);
          }
        });
        // Handle low-level socket close/errors (e.g., network hiccups)
        this.stompClient.onWebSocketClose = () => {
          console.warn('WebSocket closed');
          this.isConnectedSubject.next(false);
          // Allow a fresh connect attempt
          this.connectionPromise = null;
        };
        this.stompClient.onWebSocketError = (ev) => {
          console.error('WebSocket error', ev);
          this.isConnectedSubject.next(false);
        };
        this.stompClient.activate();
      });
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.stompClient?.connected) return;
    this.connectWebSocket();
    await this.connectionPromise;
  }

  async subscribeToSession(sessionId: string): Promise<void> {
    await this.ensureConnected();

    if (!this.stompClient?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    // Deduplicate subscription: unsubscribe previous if different
    if (this.currentSubscribedSessionId === sessionId) {
      return;
    }
    this.unsubscribeFromCurrent();

    // Clear previous frame/command payloads so UI shows Connecting state quickly
    this.cameraFrameSubject.next(null);
    this.cameraCommandSubject.next(null);

    // Subscribe to frame topic
    this.currentFrameSubscription = this.stompClient.subscribe(`/topic/camera/${sessionId}`, (message) => {
      const frameData = JSON.parse(message.body);
      this.cameraFrameSubject.next(frameData);
    });

    // Subscribe to command topic
    this.currentCommandSubscription = this.stompClient.subscribe(`/topic/camera/command/${sessionId}`, (message) => {
      const commandData = JSON.parse(message.body);
      this.cameraCommandSubject.next(commandData);
    });

    this.currentSubscribedSessionId = sessionId;
  }

  async sendCameraFrame(sessionId: string, frameData: any): Promise<void> {
    await this.ensureConnected();

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

  async sendControlCommand(sessionId: string, command: string, payload: any = {}): Promise<void> {
    await this.ensureConnected();

    if (!this.stompClient?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.stompClient.publish({
      destination: `/app/camera/command/${sessionId}`,
      body: JSON.stringify({ command, ...payload })
    });
  }

  unsubscribeFromCurrent(): void {
    if (this.currentFrameSubscription) {
      try { this.currentFrameSubscription.unsubscribe(); } catch {}
      this.currentFrameSubscription = null;
    }
    if (this.currentCommandSubscription) {
      try { this.currentCommandSubscription.unsubscribe(); } catch {}
      this.currentCommandSubscription = null;
    }
    this.currentSubscribedSessionId = null;
    // Reset last-known payloads so UI can reflect cleared state
    this.cameraFrameSubject.next(null);
    this.cameraCommandSubject.next(null);
  }

  disconnectWebSocket(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectionPromise = null;
      this.isConnectedSubject.next(false);
      this.unsubscribeFromCurrent();
    }
  }
}