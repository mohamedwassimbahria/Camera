import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, VideoRecord, Screenshot } from '../../services/camera.service';

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './media-library.component.html',
  styleUrls: ['./media-library.component.css']
})
export class MediaLibraryComponent implements OnInit {
  videos: VideoRecord[] = [];
  screenshots: Screenshot[] = [];
  filteredVideos: VideoRecord[] = [];
  filteredScreenshots: Screenshot[] = [];
  uniqueDevices: string[] = [];
  selectedDevice: string = '';
  selectedImage: Screenshot | null = null;
  selectedTab: 'videos' | 'screenshots' = 'videos';
  
  constructor(private cameraService: CameraService) {}
  
  ngOnInit(): void {
    this.refreshMedia();
  }
  
  setTab(tab: 'videos' | 'screenshots'): void {
    this.selectedTab = tab;
  }

  confirmDeleteVideo(video: VideoRecord): void {
    if (!confirm(`Delete video ${video.fileName}? This cannot be undone.`)) return;
    this.cameraService.deleteVideo(video.id).subscribe({
      next: () => {
        this.videos = this.videos.filter(v => v.id !== video.id);
        this.applyFilter();
      },
      error: (err) => console.error('Failed to delete video', err)
    });
  }

  confirmDeleteScreenshot(s: Screenshot): void {
    if (!confirm(`Delete screenshot ${s.fileName}? This cannot be undone.`)) return;
    this.cameraService.deleteScreenshot(s.id).subscribe({
      next: () => {
        this.screenshots = this.screenshots.filter(x => x.id !== s.id);
        this.applyFilter();
      },
      error: (err) => console.error('Failed to delete screenshot', err)
    });
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