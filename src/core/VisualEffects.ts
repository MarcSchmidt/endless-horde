// Visual effects system for enhanced area feedback and animations
import { AreaConfig } from '../managers/AreaManager.ts';
import { ObjectPool } from './ObjectPool.ts';
import { EntityCuller } from './EntityCuller.ts';
// import { BatchRenderer } from './BatchRenderer.ts';
import { PerformanceMonitor } from './PerformanceMonitor.ts';

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
  
  // Performance optimization components
  private particlePool: ObjectPool<ParticleEffect>;
  private entityCuller: EntityCuller;
  // private batchRenderer: BatchRenderer;
  private performanceMonitor: PerformanceMonitor;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Initialize performance optimization components
    this.entityCuller = EntityCuller.getInstance();
    // this.batchRenderer = BatchRenderer.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    // Initialize object pool for particles
    this.particlePool = new ObjectPool<ParticleEffect>(
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        color: '#ffffff',
        size: 1
      }),
      (particle: ParticleEffect) => {
        // Reset particle state
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.life = 0;
        particle.maxLife = 0;
        particle.color = '#ffffff';
        particle.size = 1;
      },
      20,  // Initial pool size
      100  // Max pool size
    );
  }

  // Update all visual effects
  update(deltaTime: number): void {
    // Cull particles based on performance
    this.particles = this.entityCuller.cullParticles(
      this.particles,
      this.canvasWidth,
      this.canvasHeight
    );

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx * deltaTime / 1000;
      particle.y += particle.vy * deltaTime / 1000;
      
      // Update life
      particle.life -= deltaTime;
      
      // Remove dead particles and return to pool
      if (particle.life <= 0) {
        this.particlePool.release(particle);
        this.particles.splice(i, 1);
      }
    }
  }

  // Render all visual effects
  render(ctx: CanvasRenderingContext2D): void {
    // Skip effects if performance is too low
    if (this.performanceMonitor.shouldSkipEffects()) {
      return;
    }

    // Group particles by color for batch rendering
    const particlesByColor = new Map<string, ParticleEffect[]>();
    
    for (const particle of this.particles) {
      const colorKey = particle.color;
      if (!particlesByColor.has(colorKey)) {
        particlesByColor.set(colorKey, []);
      }
      particlesByColor.get(colorKey)!.push(particle);
    }

    ctx.save();
    
    // Render particles in batches by color
    for (const [color, colorParticles] of particlesByColor) {
      ctx.fillStyle = color;
      ctx.beginPath();
      
      for (const particle of colorParticles) {
        const alpha = particle.life / particle.maxLife;
        
        // Skip very faded particles in reduced quality mode
        if (this.performanceMonitor.shouldUseReducedQuality() && alpha < 0.3) {
          continue;
        }
        
        ctx.globalAlpha = alpha;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      }
      
      ctx.fill();
    }
    
    ctx.restore();
    
    // Track render call
    this.performanceMonitor.incrementRenderCalls();
  }

  // Create death effect when walker is defeated
  createDeathEffect(x: number, y: number, color: string): void {
    // Reduce particle count based on performance
    let particleCount = 8;
    if (this.performanceMonitor.shouldUseReducedQuality()) {
      particleCount = 4;
    } else if (this.performanceMonitor.getPerformanceLevel() === 'medium') {
      particleCount = 6;
    }
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      
      const particle = this.particlePool.get();
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 1000;
      particle.maxLife = 1000;
      particle.color = color;
      particle.size = 2 + Math.random() * 3;
      
      this.particles.push(particle);
    }
  }

  // Create area transition effect
  createAreaTransitionEffect(area: AreaConfig): void {
    // Reduce particle count based on performance
    let particleCount = 20;
    if (this.performanceMonitor.shouldUseReducedQuality()) {
      particleCount = 8;
    } else if (this.performanceMonitor.getPerformanceLevel() === 'medium') {
      particleCount = 12;
    }
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.particlePool.get();
      particle.x = Math.random() * this.canvasWidth;
      particle.y = Math.random() * this.canvasHeight;
      particle.vx = (Math.random() - 0.5) * 100;
      particle.vy = (Math.random() - 0.5) * 100;
      particle.life = 2000;
      particle.maxLife = 2000;
      particle.color = area.walkerColors[Math.floor(Math.random() * area.walkerColors.length)];
      particle.size = 3 + Math.random() * 5;
      
      this.particles.push(particle);
    }
  }

  // Create ambient particles for area atmosphere
  createAmbientParticles(area: AreaConfig): void {
    // Skip ambient particles if performance is low
    if (this.performanceMonitor.shouldSkipEffects()) {
      return;
    }
    
    // Reduce spawn rate based on performance
    let spawnChance = 0.02;
    if (this.performanceMonitor.shouldUseReducedQuality()) {
      spawnChance = 0.005;
    } else if (this.performanceMonitor.getPerformanceLevel() === 'medium') {
      spawnChance = 0.01;
    }
    
    // Only create ambient particles occasionally
    if (Math.random() > spawnChance) return;
    
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

    const particle = this.particlePool.get();
    particle.x = x;
    particle.y = y;
    particle.vx = vx;
    particle.vy = vy;
    particle.life = 3000 + Math.random() * 2000;
    particle.maxLife = 5000;
    particle.color = color;
    particle.size = 1 + Math.random() * 2;
    
    this.particles.push(particle);
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
    // Return all particles to pool
    for (const particle of this.particles) {
      this.particlePool.release(particle);
    }
    this.particles = [];
  }

  // Get particle count for debugging
  getParticleCount(): number {
    return this.particles.length;
  }
}