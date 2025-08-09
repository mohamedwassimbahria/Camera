import { Routes } from '@angular/router';
import { CameraComponent } from './components/camera/camera.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MediaLibraryComponent } from './components/media-library/media-library.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'camera', component: CameraComponent },
  { path: 'media', component: MediaLibraryComponent },
  { path: '**', redirectTo: '/dashboard' }
];