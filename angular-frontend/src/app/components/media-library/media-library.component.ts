import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, VideoRecord, Screenshot } from '../../services/camera.service';

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">
              <i class="bi bi-collection-play"></i> Media Library
            </h4>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm" (click)="refreshMedia()">
                <i class="bi bi-arrow-clockwise"></i> Refresh
              </button>
              <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                        type="button" data-bs-toggle="dropdown">
                  Filter by Device
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="#" (click)="filterByDevice('')">All Devices</a></li>
                  <li *ngFor="let device of uniqueDevices">
                    <a class="dropdown-item" href="#" (click)="filterByDevice(device)">
                      {{ device }}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="card-body">
            <!-- Tabs for Videos and Screenshots -->
            <ul class="nav nav-tabs mb-4" id="mediaTab" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="videos-tab" data-bs-toggle="tab" 
                        data-bs-target="#videos" type="button" role="tab">
                  <i class="bi bi-play-circle"></i> Videos ({{ filteredVideos.length }})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="screenshots-tab" data-bs-toggle="tab" 
                        data-bs-target="#screenshots" type="button" role="tab">
                  <i class="bi bi-camera"></i> Screenshots ({{ filteredScreenshots.length }})
                </button>
              </li>
            </ul>
            
            <div class="tab-content" id="mediaTabContent">
              <!-- Videos Tab -->
              <div class="tab-pane fade show active" id="videos" role="tabpanel">
                <div *ngIf="filteredVideos.length === 0" class="text-center py-5">
                  <i class="bi bi-play-circle display-1 text-muted"></i>
                  <h4 class="mt-3 text-muted">No videos found</h4>
                  <p class="text-muted">Start recording from the camera page to see videos here.</p>
                </div>
                
                <div class="row g-3" *ngIf="filteredVideos.length > 0">
                  <div class="col-lg-4 col-md-6" *ngFor="let video of filteredVideos">
                    <div class="card h-100">
                      <div class="video-wrapper">
                        <video class="card-img-top video-thumbnail" controls preload="metadata">
                          <source [src]="getVideoUrl(video.fileName)" type="video/webm">
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div class="card-body">
                        <h6 class="card-title">{{ video.fileName }}</h6>
                        <div class="media-info">
                          <small class="text-muted d-block">
                            <i class="bi bi-device-ssd"></i> Device: {{ video.deviceId }}
                          </small>
                          <small class="text-muted d-block">
                            <i class="bi bi-calendar"></i> {{ video.recordedAt | date:'medium' }}
                          </small>
                          <small class="text-muted d-block">
                            <i class="bi bi-file-earmark"></i> {{ formatFileSize(video.fileSize) }}
                          </small>
                          <small class="text-muted d-block" *ngIf="video.duration">
                            <i class="bi bi-clock"></i> {{ formatDuration(video.duration) }}
                          </small>
                        </div>
                      </div>
                      <div class="card-footer">
                        <div class="d-grid gap-2">
                          <a [href]="getVideoUrl(video.fileName)" 
                             download 
                             class="btn btn-primary btn-sm">
                            <i class="bi bi-download"></i> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Screenshots Tab -->
              <div class="tab-pane fade" id="screenshots" role="tabpanel">
                <div *ngIf="filteredScreenshots.length === 0" class="text-center py-5">
                  <i class="bi bi-camera display-1 text-muted"></i>
                  <h4 class="mt-3 text-muted">No screenshots found</h4>
                  <p class="text-muted">Take screenshots from the camera page to see them here.</p>
                </div>
                
                <div class="row g-3" *ngIf="filteredScreenshots.length > 0">
                  <div class="col-lg-3 col-md-4 col-sm-6" *ngFor="let screenshot of filteredScreenshots">
                    <div class="card h-100">
                      <div class="image-wrapper">
                        <img [src]="getScreenshotUrl(screenshot.fileName)" 
                             class="card-img-top screenshot-thumbnail"
                             [alt]="screenshot.fileName"
                             (click)="openImageModal(screenshot)">
                      </div>
                      <div class="card-body p-2">
                        <h6 class="card-title small">{{ screenshot.fileName }}</h6>
                        <div class="media-info">
                          <small class="text-muted d-block">
                            <i class="bi bi-device-ssd"></i> {{ screenshot.deviceId }}
                          </small>
                          <small class="text-muted d-block">
                            <i class="bi bi-calendar"></i> {{ screenshot.capturedAt | date:'short' }}
                          </small>
                          <small class="text-muted d-block">
                            <i class="bi bi-file-earmark"></i> {{ formatFileSize(screenshot.fileSize) }}
                          </small>
                          <small class="text-muted d-block" *ngIf="screenshot.width && screenshot.height">
                            <i class="bi bi-aspect-ratio"></i> {{ screenshot.width }}x{{ screenshot.height }}
                          </small>
                        </div>
                      </div>
                      <div class="card-footer p-2">
                        <a [href]="getScreenshotUrl(screenshot.fileName)" 
                           download 
                           class="btn btn-primary btn-sm w-100">
                          <i class="bi bi-download"></i> Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Image Modal -->
    <div class="modal fade" id="imageModal" tabindex="-1" *ngIf="selectedImage">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedImage.fileName }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img [src]="getScreenshotUrl(selectedImage.fileName)" 
                 class="img-fluid" 
                 [alt]="selectedImage.fileName">
            <div class="mt-3">
              <p class="text-muted">
                Device: {{ selectedImage.deviceId }} | 
                Captured: {{ selectedImage.capturedAt | date:'medium' }} |
                Size: {{ formatFileSize(selectedImage.fileSize) }}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <a [href]="getScreenshotUrl(selectedImage.fileName)" 
               download 
               class="btn btn-primary">
              <i class="bi bi-download"></i> Download
            </a>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-wrapper, .image-wrapper {
      position: relative;
      background: #000;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
    }
    
    .video-thumbnail {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    
    .screenshot-thumbnail {
      width: 100%;
      height: 150px;
      object-fit: cover;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .screenshot-thumbnail:hover {
      transform: scale(1.05);
    }
    
    .media-info {
      font-size: 0.85rem;
    }
    
    .media-info i {
      width: 14px;
      margin-right: 5px;
    }
    
    .card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .nav-tabs .nav-link {
      border-radius: 8px 8px 0 0;
    }
    
    .nav-tabs .nav-link.active {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border-color: transparent;
    }
  `]
})
export class MediaLibraryComponent implements OnInit {
  videos: VideoRecord[] = [];
  screenshots: Screenshot[] = [];
  filteredVideos: VideoRecord[] = [];
  filteredScreenshots: Screenshot[] = [];
  uniqueDevices: string[] = [];
  selectedDevice: string = '';
  selectedImage: Screenshot | null = null;
  
  constructor(private cameraService: CameraService) {}
  
  ngOnInit(): void {
    this.refreshMedia();
  }
  
  refreshMedia(): void {
    // Load videos
    this.cameraService.getAllVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.updateUniqueDevices();
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error loading videos:', error);
      }
    });
    
    // Load screenshots
    this.cameraService.getAllScreenshots().subscribe({
      next: (screenshots) => {
        this.screenshots = screenshots;
        this.updateUniqueDevices();
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error loading screenshots:', error);
      }
    });
  }
  
  private updateUniqueDevices(): void {
    const devices = new Set<string>();
    this.videos.forEach(v => devices.add(v.deviceId));
    this.screenshots.forEach(s => devices.add(s.deviceId));
    this.uniqueDevices = Array.from(devices).sort();
  }
  
  filterByDevice(deviceId: string): void {
    this.selectedDevice = deviceId;
    this.applyFilter();
  }
  
  private applyFilter(): void {
    if (this.selectedDevice) {
      this.filteredVideos = this.videos.filter(v => v.deviceId === this.selectedDevice);
      this.filteredScreenshots = this.screenshots.filter(s => s.deviceId === this.selectedDevice);
    } else {
      this.filteredVideos = [...this.videos];
      this.filteredScreenshots = [...this.screenshots];
    }
  }
  
  getVideoUrl(fileName: string): string {
    return this.cameraService.downloadVideo(fileName);
  }
  
  getScreenshotUrl(fileName: string): string {
    return this.cameraService.downloadScreenshot(fileName);
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  openImageModal(screenshot: Screenshot): void {
    this.selectedImage = screenshot;
    // Bootstrap modal trigger would be handled by Bootstrap JS
  }
}