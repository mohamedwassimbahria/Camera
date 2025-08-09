import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(45deg, #667eea, #764ba2);">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">
          <i class="bi bi-camera-video"></i> Theft Detection System
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
                <i class="bi bi-speedometer2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/camera" routerLinkActive="active">
                <i class="bi bi-camera"></i> Camera
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/media" routerLinkActive="active">
                <i class="bi bi-collection-play"></i> Media Library
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="container-fluid">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .navbar-brand {
      font-size: 1.5rem;
    }
    
    .nav-link {
      margin: 0 10px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover, .nav-link.active {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .bi {
      margin-right: 5px;
    }
  `]
})
export class AppComponent {
  title = 'Theft Detection Camera System';
}