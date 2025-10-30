import { Routes } from '@angular/router';
import { CameraComponent } from './components/camera/camera.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MediaLibraryComponent } from './components/media-library/media-library.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'camera', component: CameraComponent },
  { path: 'media', component: MediaLibraryComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '/dashboard' }
];