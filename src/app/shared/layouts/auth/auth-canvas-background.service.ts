import { Injectable, NgZone } from '@angular/core';

type BallType = 'SOCCER' | 'BASKETBALL' | 'TENNIS' | 'TABLE_TENNIS' | 'BADMINTON' | 'VOLLEYBALL';

interface SportsParticle {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
  type: BallType;
  rotation: number;
  rotationSpeed: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthCanvasBackgroundService {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D | null;
  private animationFrameId!: number;

  private mouseX = 0;
  private mouseY = 0;
  private currentVPX = 0;
  private currentVPY = 0;

  private particles: SportsParticle[] = [];
  private readonly particleCount = 40;

  private readonly ballEmojis: Record<BallType, string> = {
    SOCCER: '⚽',
    BASKETBALL: '🏀',
    TENNIS: '🎾',
    TABLE_TENNIS: '🏓',
    BADMINTON: '🏸',
    VOLLEYBALL: '🏐'
  };

  private ballCache: Map<BallType, HTMLCanvasElement> = new Map();
  private readonly baseSpriteSize = 90;

  private resizeListener!: () => void;
  private mouseMoveListener!: (e: MouseEvent) => void;

  constructor(private ngZone: NgZone) {}

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    
    this.initCanvas();
    this.generateBallSprites();

    this.currentVPX = this.canvas.width / 2;
    this.currentVPY = this.canvas.height / 2;

    this.initParticles();

    // Run animation outside of Angular to optimize performance
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });

    this.resizeListener = () => {
      this.ngZone.runOutsideAngular(() => {
        this.initCanvas();
      });
    };
    window.addEventListener('resize', this.resizeListener);

    this.mouseMoveListener = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', this.mouseMoveListener);
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
    this.ballCache.clear();
    this.particles = [];
  }

  private initCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  private generateBallSprites() {
    Object.entries(this.ballEmojis).forEach(([type, emoji]) => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = this.baseSpriteSize;
      offCanvas.height = this.baseSpriteSize;
      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        offCtx.font = `${this.baseSpriteSize * 0.75}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(emoji, this.baseSpriteSize / 2, this.baseSpriteSize / 2);
      }

      this.ballCache.set(type as BallType, offCanvas);
    });
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createRandomParticle(true));
    }
  }

  private createRandomParticle(randomZ = false): SportsParticle {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * 500;
    const ballTypes: BallType[] = ['SOCCER', 'BASKETBALL', 'TENNIS', 'TABLE_TENNIS', 'BADMINTON', 'VOLLEYBALL'];

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: randomZ ? Math.random() * 1000 : 1000,
      speed: 1.2 + Math.random() * 2.2,
      size: 20 + Math.random() * 22,
      type: ballTypes[Math.floor(Math.random() * ballTypes.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025
    };
  }

  private animate() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const targetVPX = this.canvas.width / 2 + (this.mouseX - this.canvas.width / 2) * 0.15;
    const targetVPY = this.canvas.height / 2 + (this.mouseY - this.canvas.height / 2) * 0.15;

    this.currentVPX += (targetVPX - this.currentVPX) * 0.08;
    this.currentVPY += (targetVPY - this.currentVPY) * 0.08;

    // Ray background lines
    this.ctx.lineWidth = 1.0;
    const rayCount = 14;
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

    // Render 3D depth particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.z -= p.speed;
      p.rotation += p.rotationSpeed;

      if (p.z <= 0) {
        this.particles[i] = this.createRandomParticle(false);
        continue;
      }

      const fov = 350;
      const scale = fov / (p.z + 1);
      const screenX = this.currentVPX + p.x * scale;
      const screenY = this.currentVPY + p.y * scale;

      if (screenX >= -100 && screenX <= this.canvas.width + 100 && screenY >= -100 && screenY <= this.canvas.height + 100) {
        const renderSize = Math.max(8, p.size * scale);
        const sprite = this.ballCache.get(p.type);

        let alpha = 0.95;
        if (p.z > 800) alpha = (1000 - p.z) / 200;
        else if (p.z < 150) alpha = p.z / 150;

        if (sprite) {
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          this.ctx.translate(screenX, screenY);
          this.ctx.rotate(p.rotation);

          if (p.z < 180) {
            const blurAmount = ((180 - p.z) / 180) * 4;
            this.ctx.filter = `blur(${blurAmount}px)`;
          }

          this.ctx.drawImage(
            sprite,
            -renderSize / 2,
            -renderSize / 2,
            renderSize,
            renderSize
          );

          this.ctx.restore();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
