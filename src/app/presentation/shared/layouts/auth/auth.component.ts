import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from "@environments/environment";
import { AuthCanvasBackgroundService } from './auth-canvas-background.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AuthComponent implements AfterViewInit, OnDestroy {
  private canvasBackgroundService = inject(AuthCanvasBackgroundService);

  navigateToHome() {
    window.location.href = environment.clientApiUrl;
  }

  ngAfterViewInit() {
    const canvas = document.getElementById('auth-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.canvasBackgroundService.initialize(canvas);
    }
  }

  ngOnDestroy() {
    this.canvasBackgroundService.destroy();
  }
}
