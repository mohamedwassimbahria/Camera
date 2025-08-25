import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light shadow-sm" style="background: linear-gradient(90deg, #a8c5ff, #e3b7ff);">
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
    
    <div class="container-fluid mt-3">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .navbar-brand { font-size: 1.5rem; letter-spacing: .5px; }
    .nav-link { margin: 0 8px; border-radius: 10px; transition: all 0.2s ease; }
    .nav-link:hover { background: rgba(0,0,0,.05); transform: translateY(-1px); }
    .nav-link.active { background: rgba(0,0,0,.08); }
    .bi { margin-right: 6px; }
  `]
})
export class AppComponent {
  title = 'Theft Detection Camera System';
}