// Visual effects system for enhanced area feedback and animations
import { AreaConfig } from '../managers/AreaManager.ts';

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class VisualEffects {
  private particles: ParticleEffect[] = [];
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  // Update all visual effects
  update(deltaTime: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx * deltaTime / 1000;
      particle.y += particle.vy * deltaTime / 1000;
      
      // Update life
      particle.life -= deltaTime;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Render all visual effects
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Render particles
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  // Create death effect when walker is defeated
  createDeathEffect(x: number, y: number, color: string): void {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000,
        maxLife: 1000,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  // Create area transition effect
  createAreaTransitionEffect(area: AreaConfig): void {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        life: 2000,
        maxLife: 2000,
        color: area.walkerColors[Math.floor(Math.random() * area.walkerColors.length)],
        size: 3 + Math.random() * 5
      });
    }
  }

  // Create ambient particles for area atmosphere
  createAmbientParticles(area: AreaConfig): void {
    // Only create ambient particles occasionally
    if (Math.random() > 0.02) return;
    
    const edgeSpawn = Math.random() < 0.5;
    let x, y, vx, vy;
    
    if (edgeSpawn) {
      // Spawn from edges
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: // Top
          x = Math.random() * this.canvasWidth;
          y = -10;
          vx = (Math.random() - 0.5) * 20;
          vy = 10 + Math.random() * 20;
          break;
        case 1: // Right
          x = this.canvasWidth + 10;
          y = Math.random() * this.canvasHeight;
          vx = -10 - Math.random() * 20;
          vy = (Math.random() - 0.5) * 20;
          break;
        case 2: // Bottom
          x = Math.random() * this.canvasWidth;
          y = this.canvasHeight + 10;
          vx = (Math.random() - 0.5) * 20;
          vy = -10 - Math.random() * 20;
          break;
        default: // Left
          x = -10;
          y = Math.random() * this.canvasHeight;
          vx = 10 + Math.random() * 20;
          vy = (Math.random() - 0.5) * 20;
          break;
      }
    } else {
      // Spawn randomly in canvas
      x = Math.random() * this.canvasWidth;
      y = Math.random() * this.canvasHeight;
      vx = (Math.random() - 0.5) * 30;
      vy = (Math.random() - 0.5) * 30;
    }

    // Choose color based on area
    const colors = [...area.walkerColors, area.backgroundColor];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.particles.push({
      x,
      y,
      vx,
      vy,
      life: 3000 + Math.random() * 2000,
      maxLife: 5000,
      color,
      size: 1 + Math.random() * 2
    });
  }

  // Render area-specific background effects
  renderBackgroundEffects(ctx: CanvasRenderingContext2D, area: AreaConfig): void {
    ctx.save();
    
    // Create subtle gradient overlay based on area
    const gradient = ctx.createRadialGradient(
      this.canvasWidth / 2, this.canvasHeight / 2, 0,
      this.canvasWidth / 2, this.canvasHeight / 2, Math.max(this.canvasWidth, this.canvasHeight) / 2
    );
    
    // Area-specific gradient effects
    switch (area.id) {
      case 0: // Peaceful Village - soft blue
        gradient.addColorStop(0, 'rgba(135, 206, 235, 0.1)');
        gradient.addColorStop(1, 'rgba(135, 206, 235, 0.05)');
        break;
      case 1: // Busy Town - purple tint
        gradient.addColorStop(0, 'rgba(221, 160, 221, 0.1)');
        gradient.addColorStop(1, 'rgba(221, 160, 221, 0.05)');
        break;
      case 2: // Fortified City - golden tint
        gradient.addColorStop(0, 'rgba(240, 230, 140, 0.1)');
        gradient.addColorStop(1, 'rgba(240, 230, 140, 0.05)');
        break;
      case 3: // Military Base - brown/tan
        gradient.addColorStop(0, 'rgba(205, 133, 63, 0.1)');
        gradient.addColorStop(1, 'rgba(205, 133, 63, 0.05)');
        break;
      case 4: // Fortress Capital - dark brown
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.15)');
        gradient.addColorStop(1, 'rgba(139, 69, 19, 0.08)');
        break;
      default:
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
        break;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    ctx.restore();
  }

  // Update canvas dimensions
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // Clear all effects
  clear(): void {
    this.particles = [];
  }

  // Get particle count for debugging
  getParticleCount(): number {
    return this.particles.length;
  }
}