import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CameraService, CameraSession } from '../../services/camera.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">
              <i class="bi bi-speedometer2"></i> Theft Detection Dashboard
            </h4>
            <div class="text-muted">
              <i class="bi bi-clock"></i> {{ currentTime | date:'medium' }}
            </div>
          </div>
          <div class="card-body">
            <div class="row g-4">
              <!-- System Status Cards -->
              <div class="col-md-3">
                <div class="card text-center h-100" 
                     [class]="activeSessions.length > 0 ? 'border-success' : 'border-secondary'">
                  <div class="card-body">
                    <div class="display-4 mb-3" 
                         [class]="activeSessions.length > 0 ? 'text-success' : 'text-secondary'">
                      <i class="bi bi-camera-video"></i>
                    </div>
                    <h5 class="card-title">Active Sessions</h5>
                    <h2 class="text-primary">{{ activeSessions.length }}</h2>
                    <p class="card-text">
                      <small class="text-muted">Camera sessions running</small>
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-3">
                <div class="card text-center h-100 border-info">
                  <div class="card-body">
                    <div class="display-4 mb-3 text-info">
                      <i class="bi bi-collection-play"></i>
                    </div>
                    <h5 class="card-title">Total Videos</h5>
                    <h2 class="text-info">{{ totalVideos }}</h2>
                    <p class="card-text">
                      <small class="text-muted">Recorded videos</small>
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-3">
                <div class="card text-center h-100 border-warning">
                  <div class="card-body">
                    <div class="display-4 mb-3 text-warning">
                      <i class="bi bi-camera"></i>
                    </div>
                    <h5 class="card-title">Screenshots</h5>
                    <h2 class="text-warning">{{ totalScreenshots }}</h2>
                    <p class="card-text">
                      <small class="text-muted">Captured images</small>
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-3">
                <div class="card text-center h-100" 
                     [class]="wsConnected ? 'border-success' : 'border-danger'">
                  <div class="card-body">
                    <div class="display-4 mb-3" 
                         [class]="wsConnected ? 'text-success' : 'text-danger'">
                      <i class="bi" [class]="wsConnected ? 'bi-wifi' : 'bi-wifi-off'"></i>
                    </div>
                    <h5 class="card-title">Connection</h5>
                    <h2 [class]="wsConnected ? 'text-success' : 'text-danger'">
                      {{ wsConnected ? 'Online' : 'Offline' }}
                    </h2>
                    <p class="card-text">
                      <small class="text-muted">WebSocket status</small>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="col-12 mt-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-lightning"></i> Quick Actions
            </h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <a routerLink="/camera" class="btn btn-primary btn-lg w-100">
                  <i class="bi bi-camera"></i> Start Camera
                </a>
              </div>
              <div class="col-md-4">
                <a routerLink="/media" class="btn btn-info btn-lg w-100">
                  <i class="bi bi-collection-play"></i> View Media
                </a>
              </div>
              <div class="col-md-4">
                <button class="btn btn-success btn-lg w-100" (click)="refreshData()">
                  <i class="bi bi-arrow-clockwise"></i> Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Active Sessions List -->
      <div class="col-12 mt-4" *ngIf="activeSessions.length > 0">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-activity"></i> Active Camera Sessions
            </h5>
          </div>
          <div class="card-body">
            <div class="list-group">
              <div class="list-group-item" *ngFor="let session of activeSessions">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">
                      <span class="status-indicator status-connected"></span>
                      {{ session.deviceId }}
                    </h6>
                    <p class="mb-1">
                      <small class="text-muted">
                        Session ID: {{ session.sessionId.substring(0, 8) }}...
                      </small>
                    </p>
                    <small class="text-muted">
                      Started: {{ session.startTime | date:'short' }} |
                      IP: {{ session.ipAddress }}
                    </small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-success">Active</span>
                    <div class="mt-1">
                      <small class="text-muted">
                        Duration: {{ getSessionDuration(session.startTime) }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- System Information -->
      <div class="col-12 mt-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-info-circle"></i> System Information
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Server Status</h6>
                <ul class="list-unstyled">
                  <li>
                    <i class="bi bi-server text-primary"></i>
                    Backend API: 
                    <span class="badge bg-success ms-2">Connected</span>
                  </li>
                  <li>
                    <i class="bi bi-broadcast text-info"></i>
                    WebSocket: 
                    <span class="badge ms-2" [class]="wsConnected ? 'bg-success' : 'bg-danger'">
                      {{ wsConnected ? 'Connected' : 'Disconnected' }}
                    </span>
                  </li>
                  <li>
                    <i class="bi bi-database text-warning"></i>
                    Database: 
                    <span class="badge bg-success ms-2">MySQL Ready</span>
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <h6>Features Available</h6>
                <ul class="list-unstyled">
                  <li><i class="bi bi-check-circle text-success"></i> Real-time Camera Streaming</li>
                  <li><i class="bi bi-check-circle text-success"></i> Video Recording</li>
                  <li><i class="bi bi-check-circle text-success"></i> Screenshot Capture</li>
                  <li><i class="bi bi-check-circle text-success"></i> File Storage</li>
                  <li><i class="bi bi-check-circle text-success"></i> Session Management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    
    .card:hover {
      transform: translateY(-2px);
    }
    
    .display-4 {
      font-size: 3rem;
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
    
    .list-group-item {
      border-radius: 10px !important;
      margin-bottom: 8px;
      border: 1px solid rgba(0,0,0,0.125);
    }
    
    .btn-lg {
      padding: 15px 25px;
      font-size: 1.1rem;
    }
    
    .badge {
      font-size: 0.8rem;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeSessions: CameraSession[] = [];
  totalVideos: number = 0;
  totalScreenshots: number = 0;
  wsConnected: boolean = false;
  currentTime: Date = new Date();
  
  private subscriptions: Subscription[] = [];
  private refreshInterval: Subscription | null = null;
  
  constructor(private cameraService: CameraService) {}
  
  ngOnInit(): void {
    this.cameraService.connectWebSocket();
    this.refreshData();
    
    // Subscribe to WebSocket connection status
    this.subscriptions.push(
      this.cameraService.isConnected$.subscribe(connected => {
        this.wsConnected = connected;
      })
    );
    
    // Update current time every second
    this.subscriptions.push(
      interval(1000).subscribe(() => {
        this.currentTime = new Date();
      })
    );
    
    // Auto-refresh data every 30 seconds
    this.refreshInterval = interval(30000).subscribe(() => {
      this.refreshData();
    });
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }
  
  refreshData(): void {
    // Load active sessions
    this.cameraService.getActiveSessions().subscribe({
      next: (sessions) => {
        this.activeSessions = sessions;
      },
      error: (error) => {
        console.error('Error loading active sessions:', error);
        this.activeSessions = [];
      }
    });
    
    // Load total videos count
    this.cameraService.getAllVideos().subscribe({
      next: (videos) => {
        this.totalVideos = videos.length;
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.totalVideos = 0;
      }
    });
    
    // Load total screenshots count
    this.cameraService.getAllScreenshots().subscribe({
      next: (screenshots) => {
        this.totalScreenshots = screenshots.length;
      },
      error: (error) => {
        console.error('Error loading screenshots:', error);
        this.totalScreenshots = 0;
      }
    });
  }
  
  getSessionDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}