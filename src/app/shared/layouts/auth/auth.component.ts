import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastService } from '@shared/services/toast.service';
import { environment } from "@environments/environment";

interface SportsParticle {
  x: number; // Angular coordinates/radius off the center
  y: number;
  z: number; // Perspective depth coordinate (from 1000 down to 0)
  speed: number;
  size: number;
  color: string;
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AuthComponent implements AfterViewInit, OnDestroy {
  public toastService = inject(ToastService);

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D | null;
  private animationFrameId!: number;
  
  // Parallax vanishing point coordinate offsets
  private mouseX = 0;
  private mouseY = 0;
  private currentVPX = 0;
  private currentVPY = 0;

  // 3D Sports particle depth tunnel system
  private particles: SportsParticle[] = [];
  private readonly particleCount = 45;

  // Listeners
  private resizeListener!: () => void;
  private mouseMoveListener!: (e: MouseEvent) => void;

  navigateToHome() {
    window.location.href = environment.clientApiUrl;
  }

  ngAfterViewInit() {
    this.canvas = document.getElementById('auth-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.initCanvas();
      
      this.currentVPX = this.canvas.width / 2;
      this.currentVPY = this.canvas.height / 2;
      
      this.initParticles();
      this.animate();

      this.resizeListener = () => this.initCanvas();
      window.addEventListener('resize', this.resizeListener);

      this.mouseMoveListener = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
      };
      window.addEventListener('mousemove', this.mouseMoveListener);
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
  }

  private initCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createRandomParticle(true));
    }
  }

  private createRandomParticle(randomZ = false): SportsParticle {
    const angle = Math.random() * Math.PI * 2;
    // Radial distribution
    const radius = 100 + Math.random() * 400;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: randomZ ? Math.random() * 1000 : 1000,
      speed: 1.5 + Math.random() * 2.5,
      size: 1.2 + Math.random() * 2.5,
      color: Math.random() > 0.45 ? 'rgba(16, 185, 129,' : 'rgba(14, 165, 233,' // Emerald vs Sky-blue
    };
  }

  private animate() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Smooth lerping vanishing point for 3D depth parallax
    const targetVPX = this.canvas.width / 2 + (this.mouseX - this.canvas.width / 2) * 0.15;
    const targetVPY = this.canvas.height / 2 + (this.mouseY - this.canvas.height / 2) * 0.15;
    
    this.currentVPX += (targetVPX - this.currentVPX) * 0.08;
    this.currentVPY += (targetVPY - this.currentVPY) * 0.08;

    // 1. Draw static perspective stadium court outline rays
    this.ctx.lineWidth = 1.0;
    const rayCount = 16;
    for (let i = 0; i <= rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const targetX = this.currentVPX + Math.cos(angle) * Math.max(this.canvas.width, this.canvas.height) * 1.5;
      const targetY = this.currentVPY + Math.sin(angle) * Math.max(this.canvas.width, this.canvas.height) * 1.5;
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentVPX, this.currentVPY);
      this.ctx.lineTo(targetX, targetY);
      this.ctx.strokeStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.03)' : 'rgba(14, 165, 233, 0.02)';
      this.ctx.stroke();
    }

    // 2. Draw active 3D particle warp tunnel moving along depth Z-axis
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.z -= p.speed; // Move closer to viewport

      // Reset when particle zooms past screen
      if (p.z <= 0) {
        this.particles[i] = this.createRandomParticle(false);
        continue;
      }

      // 3D projection transform
      // Perspective scale factor
      const fov = 350;
      const scale = fov / (p.z + 1);
      const screenX = this.currentVPX + p.x * scale;
      const screenY = this.currentVPY + p.y * scale;

      // Draw projected particle if inside bounds
      if (screenX >= 0 && screenX <= this.canvas.width && screenY >= 0 && screenY <= this.canvas.height) {
        const radius = p.size * scale;
        
        // Alpha fades in at deep distance, fades out right before passing viewport Z=0
        let alpha = 0.85;
        if (p.z > 800) {
          alpha = (1000 - p.z) / 200; // Fade in
        } else if (p.z < 200) {
          alpha = p.z / 200; // Fade out
        }
        
        // Draw soft glowing sphere particle
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `${p.color} ${alpha * 0.45})`;
        this.ctx.shadowBlur = radius * 0.8;
        this.ctx.shadowColor = p.color.includes('16, 185') ? '#10b981' : '#0ea5e9';
        this.ctx.fill();
        this.ctx.shadowBlur = 0; // Reset shadows
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
