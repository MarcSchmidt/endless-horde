// Performance monitoring and graceful degradation system
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  entityCount: number;
  particleCount: number;
  renderCalls: number;
}

export enum PerformanceLevel {
  HIGH = 'high',
  MEDIUM = 'medium', 
  LOW = 'low'
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  // Performance tracking
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private fps: number = 60;
  private frameTime: number = 16.67; // Target 60 FPS = 16.67ms per frame
  private frameTimes: number[] = [];
  private maxFrameTimeHistory: number = 60; // Keep 1 second of frame times
  
  // Performance thresholds
  private readonly HIGH_FPS_THRESHOLD = 50;
  private readonly MEDIUM_FPS_THRESHOLD = 30;
  private readonly HIGH_FRAME_TIME_THRESHOLD = 20; // 20ms = 50 FPS
  private readonly MEDIUM_FRAME_TIME_THRESHOLD = 33; // 33ms = 30 FPS
  
  // Current performance level
  private currentLevel: PerformanceLevel = PerformanceLevel.HIGH;
  private levelChangeCallbacks: ((level: PerformanceLevel) => void)[] = [];
  
  // Entity and render tracking
  private entityCount: number = 0;
  private particleCount: number = 0;
  private renderCalls: number = 0;
  
  // Culling settings
  private cullingEnabled: boolean = false;
  private maxEntitiesBeforeCulling: number = 60;
  private maxParticlesBeforeCulling: number = 100;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Update performance metrics
  updateMetrics(currentTime: number, entityCount: number, particleCount: number): void {
    // Calculate frame time
    if (this.frameTimes.length > 0) {
      const lastFrameTime = this.frameTimes[this.frameTimes.length - 1];
      this.frameTime = currentTime - lastFrameTime;
    }
    
    // Store frame time for averaging
    this.frameTimes.push(currentTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    // Update FPS
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
      
      // Check for performance level changes
      this.updatePerformanceLevel();
    }
    
    // Update entity counts
    this.entityCount = entityCount;
    this.particleCount = particleCount;
    
    // Reset render call counter
    this.renderCalls = 0;
  }

  // Track render calls for batch optimization
  incrementRenderCalls(): void {
    this.renderCalls++;
  }

  // Update performance level based on current metrics
  private updatePerformanceLevel(): void {
    const avgFrameTime = this.getAverageFrameTime();
    let newLevel: PerformanceLevel;
    
    if (this.fps >= this.HIGH_FPS_THRESHOLD && avgFrameTime <= this.HIGH_FRAME_TIME_THRESHOLD) {
      newLevel = PerformanceLevel.HIGH;
    } else if (this.fps >= this.MEDIUM_FPS_THRESHOLD && avgFrameTime <= this.MEDIUM_FRAME_TIME_THRESHOLD) {
      newLevel = PerformanceLevel.MEDIUM;
    } else {
      newLevel = PerformanceLevel.LOW;
    }
    
    if (newLevel !== this.currentLevel) {
      console.log(`Performance level changed: ${this.currentLevel} -> ${newLevel}`);
      this.currentLevel = newLevel;
      
      // Update culling settings based on performance level
      this.updateCullingSettings();
      
      // Notify callbacks
      this.levelChangeCallbacks.forEach(callback => callback(newLevel));
    }
  }

  // Update culling settings based on performance level
  private updateCullingSettings(): void {
    switch (this.currentLevel) {
      case PerformanceLevel.HIGH:
        this.cullingEnabled = false;
        this.maxEntitiesBeforeCulling = 80;
        this.maxParticlesBeforeCulling = 150;
        break;
      case PerformanceLevel.MEDIUM:
        this.cullingEnabled = true;
        this.maxEntitiesBeforeCulling = 50;
        this.maxParticlesBeforeCulling = 75;
        break;
      case PerformanceLevel.LOW:
        this.cullingEnabled = true;
        this.maxEntitiesBeforeCulling = 30;
        this.maxParticlesBeforeCulling = 40;
        break;
    }
  }

  // Get average frame time over recent history
  private getAverageFrameTime(): number {
    if (this.frameTimes.length < 2) return this.frameTime;
    
    let totalTime = 0;
    for (let i = 1; i < this.frameTimes.length; i++) {
      totalTime += this.frameTimes[i] - this.frameTimes[i - 1];
    }
    
    return totalTime / (this.frameTimes.length - 1);
  }

  // Public getters
  getFPS(): number {
    return this.fps;
  }

  getFrameTime(): number {
    return this.frameTime;
  }

  getPerformanceLevel(): PerformanceLevel {
    return this.currentLevel;
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      entityCount: this.entityCount,
      particleCount: this.particleCount,
      renderCalls: this.renderCalls
    };
  }

  // Culling helpers
  shouldCullEntities(): boolean {
    return this.cullingEnabled && this.entityCount > this.maxEntitiesBeforeCulling;
  }

  shouldCullParticles(): boolean {
    return this.cullingEnabled && this.particleCount > this.maxParticlesBeforeCulling;
  }

  getMaxEntities(): number {
    return this.maxEntitiesBeforeCulling;
  }

  getMaxParticles(): number {
    return this.maxParticlesBeforeCulling;
  }

  // Register callback for performance level changes
  onPerformanceLevelChange(callback: (level: PerformanceLevel) => void): void {
    this.levelChangeCallbacks.push(callback);
  }

  // Check if we should use reduced quality rendering
  shouldUseReducedQuality(): boolean {
    return this.currentLevel === PerformanceLevel.LOW;
  }

  // Check if we should skip non-essential effects
  shouldSkipEffects(): boolean {
    return this.currentLevel === PerformanceLevel.LOW;
  }

  // Get recommended entity update frequency (1.0 = every frame, 0.5 = every other frame)
  getEntityUpdateFrequency(): number {
    switch (this.currentLevel) {
      case PerformanceLevel.HIGH:
        return 1.0;
      case PerformanceLevel.MEDIUM:
        return 0.8;
      case PerformanceLevel.LOW:
        return 0.6;
      default:
        return 1.0;
    }
  }
}