// System for managing walker entities
import { Walker } from '../entities/Walker.ts';
import { AreaManager } from '../managers/AreaManager.ts';

export class WalkerSystem {
  private walkers: Walker[] = [];
  private readonly targetWalkerCount: number = 40;
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnTimer: number = 0;
  private readonly spawnInterval: number = 100; // Spawn every 100ms until we reach target
  private areaManager: AreaManager;

  constructor(canvasWidth: number, canvasHeight: number, areaManager: AreaManager) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.areaManager = areaManager;
  }

  update(deltaTime: number): void {
    // Update spawn timer
    this.spawnTimer += deltaTime;
    
    // Spawn walkers if we're below target count
    if (this.walkers.length < this.targetWalkerCount && this.spawnTimer >= this.spawnInterval) {
      this.spawnWalker();
      this.spawnTimer = 0;
    }

    // Update all active walkers
    for (let i = this.walkers.length - 1; i >= 0; i--) {
      const walker = this.walkers[i];
      
      if (walker.active) {
        walker.update(deltaTime);
      } else {
        // Remove inactive walkers
        this.walkers.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render all active walkers
    for (const walker of this.walkers) {
      if (walker.active) {
        walker.render(ctx);
      }
    }
  }

  private spawnWalker(): void {
    // Spawn walker at random edge position with current area configuration
    const spawnPosition = this.getRandomEdgePosition();
    const currentArea = this.areaManager.getCurrentArea();
    const walker = new Walker(spawnPosition.x, spawnPosition.y, this.canvasWidth, this.canvasHeight, currentArea);
    this.walkers.push(walker);
  }

  private getRandomEdgePosition(): { x: number, y: number } {
    const margin = 20;
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    switch (edge) {
      case 0: // Top edge
        return {
          x: Math.random() * this.canvasWidth,
          y: -margin
        };
      case 1: // Right edge
        return {
          x: this.canvasWidth + margin,
          y: Math.random() * this.canvasHeight
        };
      case 2: // Bottom edge
        return {
          x: Math.random() * this.canvasWidth,
          y: this.canvasHeight + margin
        };
      case 3: // Left edge
        return {
          x: -margin,
          y: Math.random() * this.canvasHeight
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  // Update canvas dimensions when window resizes
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Update all existing walkers with new dimensions
    for (const walker of this.walkers) {
      walker.updateCanvasDimensions(width, height);
    }
  }

  // Get current walker count for debugging/UI
  getWalkerCount(): number {
    return this.walkers.filter(walker => walker.active).length;
  }

  // Get all active walkers (for future zombie targeting)
  getActiveWalkers(): Walker[] {
    return this.walkers.filter(walker => walker.active);
  }

  // Clear all walkers
  clear(): void {
    for (const walker of this.walkers) {
      walker.destroy();
    }
    this.walkers = [];
  }
}