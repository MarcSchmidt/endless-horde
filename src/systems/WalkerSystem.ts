// System for managing walker entities
import { Walker } from '../entities/Walker.ts';
import { AreaManager } from '../managers/AreaManager.ts';
import { ObjectPool } from '../core/ObjectPool.ts';
import { EntityCuller, CullableEntity } from '../core/EntityCuller.ts';
// import { BatchRenderer } from '../core/BatchRenderer.ts';
import { PerformanceMonitor } from '../core/PerformanceMonitor.ts';

// Extend Walker to be cullable
interface CullableWalker extends Walker, CullableEntity {}

export class WalkerSystem {
  private walkers: CullableWalker[] = [];
  private readonly targetWalkerCount: number = 40;
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnTimer: number = 0;
  private readonly spawnInterval: number = 100; // Spawn every 100ms until we reach target
  private areaManager: AreaManager;
  
  // Performance optimization components
  private walkerPool: ObjectPool<Walker>;
  private entityCuller: EntityCuller;
  // private batchRenderer: BatchRenderer;
  private performanceMonitor: PerformanceMonitor;

  constructor(canvasWidth: number, canvasHeight: number, areaManager: AreaManager) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.areaManager = areaManager;
    
    // Initialize performance optimization components
    this.entityCuller = EntityCuller.getInstance();
    // this.batchRenderer = BatchRenderer.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    // Initialize object pool for walkers
    this.walkerPool = new ObjectPool<Walker>(
      () => {
        const spawnPos = this.getRandomEdgePosition();
        const currentArea = this.areaManager.getCurrentArea();
        return new Walker(spawnPos.x, spawnPos.y, this.canvasWidth, this.canvasHeight, currentArea);
      },
      (walker: Walker) => {
        // Reset walker state
        walker.active = true;
        const spawnPos = this.getRandomEdgePosition();
        walker.position.set(spawnPos.x, spawnPos.y);
        walker.velocity.set(0, 0);
        const currentArea = this.areaManager.getCurrentArea();
        walker.updateAreaSprite(currentArea.id);
      },
      10, // Initial pool size
      50  // Max pool size
    );
  }

  update(deltaTime: number): void {
    // Update spawn timer
    this.spawnTimer += deltaTime;
    
    // Spawn walkers if we're below target count
    if (this.walkers.length < this.targetWalkerCount && this.spawnTimer >= this.spawnInterval) {
      this.spawnWalker();
      this.spawnTimer = 0;
    }

    // Cull walkers based on performance and viewport
    const culledWalkers = this.entityCuller.cullEntities(
      this.walkers, 
      this.canvasWidth, 
      this.canvasHeight
    );

    // Update active walkers with performance-based skipping
    for (let i = this.walkers.length - 1; i >= 0; i--) {
      const walker = this.walkers[i];
      
      if (!walker.active) {
        // Return inactive walker to pool and remove from array
        this.walkerPool.release(walker);
        this.walkers.splice(i, 1);
        continue;
      }
      
      // Check if this walker is in the culled list (should be updated)
      const shouldUpdate = culledWalkers.includes(walker);
      
      if (shouldUpdate && !this.entityCuller.shouldSkipUpdate(walker, this.canvasWidth, this.canvasHeight)) {
        walker.update(deltaTime);
        walker.lastUpdateTime = performance.now();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Use batch rendering for better performance
    // const currentArea = this.areaManager.getCurrentArea();
    // const batchKey = `walkers_area_${currentArea.id}`;
    
    // Add all visible walkers to batch
    for (const walker of this.walkers) {
      if (walker.active) {
        // For now, still render individually since walkers have complex animations
        // In a future optimization, we could batch static sprites
        walker.render(ctx);
        
        // Track render call
        this.performanceMonitor.incrementRenderCalls();
      }
    }
  }

  private spawnWalker(): void {
    // Get walker from pool
    const walker = this.walkerPool.get() as CullableWalker;
    
    // Set walker priority based on area (higher area = higher priority)
    const currentArea = this.areaManager.getCurrentArea();
    this.entityCuller.setEntityPriority(walker, 0.5 + (currentArea.id * 0.1));
    
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
      this.walkerPool.release(walker);
    }
    this.walkers = [];
  }

  // Update all walker sprites when area changes
  updateWalkerSprites(areaId: number): void {
    for (const walker of this.walkers) {
      if (walker.active) {
        walker.updateAreaSprite(areaId);
      }
    }
  }
}