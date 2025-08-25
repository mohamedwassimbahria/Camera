import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark shadow-sm" style="background: linear-gradient(45deg, #4c6ef5, #7b2cbf);">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold text-white" href="#">
          <i class="bi bi-camera-video"></i> Theft Detection System
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto align-items-center">
            <li class="nav-item">
              <a class="nav-link px-3" routerLink="/dashboard" routerLinkActive="active">
                <i class="bi bi-speedometer2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-3" routerLink="/camera" routerLinkActive="active">
                <i class="bi bi-camera"></i> Camera
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-3" routerLink="/media" routerLinkActive="active">
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
      letter-spacing: 0.3px;
    }
    .nav-link {
      color: rgba(255,255,255,0.9) !important;
      border-radius: 10px;
      transition: all 0.2s ease-in-out;
    }
    .nav-link:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
    }
    .nav-link.active {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.22);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
    }
    .bi {
      margin-right: 6px;
    }
  `]
})
export class AppComponent {
  title = 'Theft Detection Camera System';
}