// System for managing zombie entities
import { Zombie } from '../entities/Zombie.ts';
import { Walker } from '../entities/Walker.ts';
import { Vector2 } from '../core/Vector2.ts';
import { ResourceManager } from '../managers/ResourceManager.ts';
import { UpgradeManager } from '../managers/UpgradeManager.ts';
import { AreaManager } from '../managers/AreaManager.ts';

export class ZombieSystem {
  private zombies: Zombie[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private resourceManager: ResourceManager;
  private upgradeManager: UpgradeManager;
  private areaManager: AreaManager;
  private onWalkerDefeated?: (x: number, y: number, color: string) => void;

  constructor(canvasWidth: number, canvasHeight: number, resourceManager: ResourceManager, upgradeManager: UpgradeManager, areaManager: AreaManager) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.resourceManager = resourceManager;
    this.upgradeManager = upgradeManager;
    this.areaManager = areaManager;
  }

  update(deltaTime: number, walkers: Walker[]): void {
    // Update all active zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      
      if (zombie.active) {
        zombie.updateWithWalkers(deltaTime, walkers);
        
        // Check for collisions with walkers
        this.checkCollisions(zombie, walkers);
      } else {
        // Remove inactive zombies
        this.zombies.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render all active zombies
    for (const zombie of this.zombies) {
      if (zombie.active) {
        zombie.render(ctx);
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

    const speedMultiplier = this.upgradeManager.getZombieSpeedMultiplier();
    const zombie = new Zombie(clampedX, clampedY, this.canvasWidth, this.canvasHeight, speedMultiplier);
    this.zombies.push(zombie);
    return true;
  }

  private checkCollisions(zombie: Zombie, walkers: Walker[]): void {
    for (const walker of walkers) {
      if (!walker.active) continue;
      
      if (zombie.canAttack(walker)) {
        // Zombie attacks walker - deal damage
        const wasDefeated = walker.takeDamage(1);
        
        if (wasDefeated) {
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