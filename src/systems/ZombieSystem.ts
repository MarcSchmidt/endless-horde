// System for managing zombie entities
import { Zombie } from '../entities/Zombie.ts';
import { Walker } from '../entities/Walker.ts';
import { Vector2 } from '../core/Vector2.ts';
import { ResourceManager } from '../managers/ResourceManager.ts';
import { UpgradeManager } from '../managers/UpgradeManager.ts';
import { AreaManager } from '../managers/AreaManager.ts';
import { ObjectPool } from '../core/ObjectPool.ts';
import { EntityCuller, CullableEntity } from '../core/EntityCuller.ts';
// import { BatchRenderer } from '../core/BatchRenderer.ts';
import { PerformanceMonitor } from '../core/PerformanceMonitor.ts';
import { CollisionSystem } from '../core/CollisionSystem.ts';

// Extend Zombie to be cullable
interface CullableZombie extends Zombie, CullableEntity {}

export class ZombieSystem {
  private zombies: CullableZombie[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private resourceManager: ResourceManager;
  private upgradeManager: UpgradeManager;
  private areaManager: AreaManager;
  private onWalkerDefeated?: (x: number, y: number, color: string) => void;
  
  // Performance optimization components
  private zombiePool: ObjectPool<Zombie>;
  private entityCuller: EntityCuller;
  // private batchRenderer: BatchRenderer;
  private performanceMonitor: PerformanceMonitor;
  private collisionSystem: CollisionSystem;

  constructor(canvasWidth: number, canvasHeight: number, resourceManager: ResourceManager, upgradeManager: UpgradeManager, areaManager: AreaManager) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.resourceManager = resourceManager;
    this.upgradeManager = upgradeManager;
    this.areaManager = areaManager;
    
    // Initialize performance optimization components
    this.entityCuller = EntityCuller.getInstance();
    // this.batchRenderer = BatchRenderer.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.collisionSystem = CollisionSystem.getInstance();
    
    // Initialize object pool for zombies
    this.zombiePool = new ObjectPool<Zombie>(
      () => new Zombie(0, 0, this.canvasWidth, this.canvasHeight, this.upgradeManager.getZombieSpeedMultiplier()),
      (zombie: Zombie) => {
        // Reset zombie state
        zombie.active = true;
        zombie.position.set(0, 0);
        zombie.velocity.set(0, 0);
        zombie.updateSpeed(this.upgradeManager.getZombieSpeedMultiplier());
      },
      5,  // Initial pool size
      20  // Max pool size
    );
  }

  update(deltaTime: number, walkers: Walker[]): void {
    // Cull zombies based on performance and viewport
    const culledZombies = this.entityCuller.cullEntities(
      this.zombies, 
      this.canvasWidth, 
      this.canvasHeight
    );

    // Update active zombies with performance-based skipping
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      
      if (!zombie.active) {
        // Return inactive zombie to pool and remove from array
        this.zombiePool.release(zombie);
        this.zombies.splice(i, 1);
        continue;
      }
      
      // Check if this zombie is in the culled list (should be updated)
      const shouldUpdate = culledZombies.includes(zombie);
      
      if (shouldUpdate && !this.entityCuller.shouldSkipUpdate(zombie, this.canvasWidth, this.canvasHeight)) {
        zombie.updateWithWalkers(deltaTime, walkers);
        zombie.lastUpdateTime = performance.now();
        
        // Check for collisions with walkers
        this.checkCollisions(zombie, walkers);
      }
    }

    // Apply zombie separation to prevent stacking (only for active zombies)
    const activeZombies = this.zombies.filter(z => z.active);
    if (activeZombies.length > 1) {
      this.collisionSystem.applySeparation(activeZombies, 40); // Slightly stronger separation for zombies
    }

    // Apply boundary collision for all active zombies
    for (const zombie of activeZombies) {
      this.collisionSystem.applyBoundaryCollision(zombie, this.canvasWidth, this.canvasHeight, 100);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Use batch rendering for better performance
    // const batchKey = 'zombies';
    
    // Add all visible zombies to batch
    for (const zombie of this.zombies) {
      if (zombie.active) {
        // For now, still render individually since zombies have complex animations
        // In a future optimization, we could batch static sprites
        zombie.render(ctx);
        
        // Track render call
        this.performanceMonitor.incrementRenderCalls();
      }
    }
  }

  // Spawn a zombie at the specified position
  spawnZombie(position: Vector2): boolean {
    // Check if we're at the zombie limit
    const maxZombies = this.upgradeManager.getMaxZombies();
    if (this.zombies.length >= maxZombies) {
      return false;
    }

    // Ensure spawn position is within bounds
    const margin = 10;
    const clampedX = Math.max(margin, Math.min(this.canvasWidth - margin, position.x));
    const clampedY = Math.max(margin, Math.min(this.canvasHeight - margin, position.y));

    // Get zombie from pool
    const zombie = this.zombiePool.get() as CullableZombie;
    zombie.position.set(clampedX, clampedY);
    zombie.updateCanvasDimensions(this.canvasWidth, this.canvasHeight);
    
    // Set zombie priority (player-controlled entities have high priority)
    this.entityCuller.setEntityPriority(zombie, 0.8);
    
    this.zombies.push(zombie);
    return true;
  }

  private checkCollisions(zombie: Zombie, walkers: Walker[]): void {
    for (const walker of walkers) {
      if (!walker.active) continue;
      
      // Use the new attack system with proper cooldown
      if (zombie.performAttack(walker)) {
        // Attack was successful - walker was damaged
        console.log(`Zombie attacked walker! Walker health: ${walker.health}/${walker.maxHealth}`);
        
        // Check if walker was defeated
        if (!walker.active) {
          // Walker was defeated - award souls based on area multiplier
          const currentArea = this.areaManager.getCurrentArea();
          this.resourceManager.awardSouls(1, currentArea.soulMultiplier);
          console.log(`Zombie defeated a walker! Souls earned: ${currentArea.soulMultiplier}, Total: ${this.resourceManager.getSouls()}`);
          
          // Trigger visual effect callback if set
          if (this.onWalkerDefeated) {
            const walkerColors = currentArea.walkerColors;
            const color = walkerColors[Math.floor(Math.random() * walkerColors.length)];
            this.onWalkerDefeated(walker.position.x, walker.position.y, color);
          }
        }
        
        break; // One attack per frame per zombie
      }
    }
  }

  // Update canvas dimensions when window resizes
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Update all existing zombies with new dimensions
    for (const zombie of this.zombies) {
      zombie.updateCanvasDimensions(width, height);
    }
  }

  // Get current zombie count for debugging/UI
  getZombieCount(): number {
    return this.zombies.filter(zombie => zombie.active).length;
  }

  // Get all active zombies
  getActiveZombies(): Zombie[] {
    return this.zombies.filter(zombie => zombie.active);
  }

  // Clear all zombies
  clear(): void {
    for (const zombie of this.zombies) {
      zombie.destroy();
      this.zombiePool.release(zombie);
    }
    this.zombies = [];
  }

  // Get maximum zombie count
  getMaxZombies(): number {
    return this.upgradeManager.getMaxZombies();
  }

  // Apply speed upgrades to all existing zombies
  applySpeedUpgrades(): void {
    const speedMultiplier = this.upgradeManager.getZombieSpeedMultiplier();
    for (const zombie of this.zombies) {
      if (zombie.active) {
        zombie.updateSpeed(speedMultiplier);
      }
    }
  }

  // Set callback for when walker is defeated (for visual effects)
  setOnWalkerDefeated(callback: (x: number, y: number, color: string) => void): void {
    this.onWalkerDefeated = callback;
  }
}