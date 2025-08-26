import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CameraService, CameraSession } from '../../services/camera.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
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