// Animation system for sprite-based animations
import { AssetManager } from './AssetManager.ts';

export interface AnimationConfig {
  spriteName: string;
  frameRate: number; // frames per second
  loop: boolean;
  autoPlay: boolean;
}

export class Animation {
  private assetManager: AssetManager;
  private spriteName: string;
  private frameRate: number;
  private loop: boolean;
  private isPlaying: boolean;
  
  private currentFrame: number = 0;
  private elapsedTime: number = 0;
  private frameTime: number; // time per frame in milliseconds
  
  // Reduced motion support
  private static reducedMotionEnabled: boolean = false;

  constructor(config: AnimationConfig) {
    this.assetManager = AssetManager.getInstance();
    this.spriteName = config.spriteName;
    this.frameRate = config.frameRate;
    this.loop = config.loop;
    this.isPlaying = config.autoPlay;
    this.frameTime = 1000 / this.frameRate; // Convert FPS to milliseconds per frame
  }

  // Static method to enable/disable reduced motion globally
  public static setReducedMotion(enabled: boolean): void {
    Animation.reducedMotionEnabled = enabled;
    console.log(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
  }

  public static isReducedMotionEnabled(): boolean {
    return Animation.reducedMotionEnabled;
  }

  // Update animation frame based on delta time
  public update(deltaTime: number): void {
    if (!this.isPlaying || Animation.reducedMotionEnabled) {
      return;
    }

    this.elapsedTime += deltaTime;

    // Check if it's time to advance to the next frame
    if (this.elapsedTime >= this.frameTime) {
      this.elapsedTime -= this.frameTime;
      this.advanceFrame();
    }
  }

  private advanceFrame(): void {
    const sprite = this.assetManager.getSprite(this.spriteName);
    if (!sprite) return;

    this.currentFrame++;

    // Handle looping
    if (this.currentFrame >= sprite.frameCount) {
      if (this.loop) {
        this.currentFrame = 0;
      } else {
        this.currentFrame = sprite.frameCount - 1;
        this.isPlaying = false;
      }
    }
  }

  // Render the current animation frame
  public render(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width?: number, 
    height?: number
  ): void {
    const sprite = this.assetManager.getSprite(this.spriteName);
    if (!sprite) {
      // Fallback to simple colored rectangle if sprite not loaded
      this.renderFallback(ctx, x, y, width || 16, height || 16);
      return;
    }

    const frame = this.assetManager.getAnimationFrame(this.spriteName, this.currentFrame);
    if (!frame) return;

    const renderWidth = width || sprite.frameWidth;
    const renderHeight = height || sprite.frameHeight;

    // In reduced motion mode, always show the first frame
    const frameToRender = Animation.reducedMotionEnabled ? 
      this.assetManager.getAnimationFrame(this.spriteName, 0) : frame;

    if (frameToRender) {
      ctx.drawImage(
        sprite.image,
        frameToRender.x, frameToRender.y, frameToRender.width, frameToRender.height,
        x - renderWidth / 2, y - renderHeight / 2, renderWidth, renderHeight
      );
    }
  }

  private renderFallback(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.save();
    
    // Use a default color based on sprite name
    if (this.spriteName.includes('walker')) {
      ctx.fillStyle = '#4ecdc4';
    } else if (this.spriteName.includes('zombie')) {
      ctx.fillStyle = '#8B0000';
    } else {
      ctx.fillStyle = '#666';
    }
    
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    
    ctx.restore();
  }

  // Control methods
  public play(): void {
    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public stop(): void {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.elapsedTime = 0;
  }

  public reset(): void {
    this.currentFrame = 0;
    this.elapsedTime = 0;
  }

  // Getters
  public getCurrentFrame(): number {
    return this.currentFrame;
  }

  public isAnimationPlaying(): boolean {
    return this.isPlaying;
  }

  public getSpriteName(): string {
    return this.spriteName;
  }

  // Set new sprite (useful for changing walker sprites based on area)
  public setSprite(spriteName: string): void {
    this.spriteName = spriteName;
    this.reset(); // Reset animation when changing sprites
  }

  // Create a walking animation with appropriate frame rate
  public static createWalkAnimation(spriteName: string): Animation {
    return new Animation({
      spriteName,
      frameRate: 8, // 8 FPS for smooth walking animation
      loop: true,
      autoPlay: true
    });
  }

  // Create an idle animation (slower frame rate)
  public static createIdleAnimation(spriteName: string): Animation {
    return new Animation({
      spriteName,
      frameRate: 2, // 2 FPS for subtle idle animation
      loop: true,
      autoPlay: true
    });
  }
}