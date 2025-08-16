// Zombie entity that seeks and attacks walkers
import { Entity } from '../core/Entity.ts';
import { Vector2 } from '../core/Vector2.ts';
import { Walker } from './Walker.ts';
import { Animation } from '../core/Animation.ts';
import { CollisionEntity } from '../core/CollisionSystem.ts';
import { Attacker, AttackConfig, AttackSystem } from '../core/AttackSystem.ts';

export class Zombie extends Entity implements CollisionEntity, Attacker {
  private baseSpeed: number;
  private speed: number;
  private target: Walker | null = null;
  public size: number;

  private seekRange: number;
  
  // Attack properties
  public lastAttackTime?: number;
  private attackConfig: AttackConfig;
  private attackSystem: AttackSystem;
  
  // Animation properties
  private walkAnimation: Animation;
  private isMoving: boolean = false;

  constructor(x: number, y: number, _canvasWidth: number, _canvasHeight: number, speedMultiplier: number = 1) {
    super(x, y);
    
    this.baseSpeed = 60; // Base speed - slightly faster than walkers to catch them
    this.speed = this.baseSpeed * speedMultiplier;
    this.size = 10; // Slightly larger than walkers
    this.seekRange = 200; // Range to detect walkers
    
    // Initialize attack system and configuration
    this.attackSystem = AttackSystem.getInstance();
    this.attackConfig = {
      damage: 1,
      range: 5, // 5px attack range beyond collision
      cooldown: 500 // 500ms cooldown between attacks
    };
    
    // Initialize zombie animation
    this.walkAnimation = Animation.createWalkAnimation('zombie');
  }

  update(deltaTime: number): void {
    // Call parent update first
    super.update(deltaTime);
  }

  // Separate method for zombie-specific update with walker targeting
  updateWithWalkers(deltaTime: number, walkers: Walker[]): void {
    if (!this.active) return;

    // Find the nearest walker to target
    this.findNearestWalker(walkers);

    // Move towards target if we have one
    if (this.target && this.target.active) {
      this.seekTarget();
      this.isMoving = true;
    } else {
      // No target, stop moving
      this.velocity.set(0, 0);
      this.isMoving = false;
    }

    // Update position using parent method
    this.update(deltaTime);

    // Update animation
    if (this.isMoving) {
      this.walkAnimation.play();
    } else {
      this.walkAnimation.pause();
    }
    this.walkAnimation.update(deltaTime);
  }

  private findNearestWalker(walkers: Walker[]): void {
    let nearestWalker: Walker | null = null;
    let nearestDistance = Infinity;

    for (const walker of walkers) {
      if (!walker.active) continue;

      const distance = this.position.distanceTo(walker.position);
      
      // Only consider walkers within seek range
      if (distance <= this.seekRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestWalker = walker;
      }
    }

    this.target = nearestWalker;
  }

  private seekTarget(): void {
    if (!this.target) return;

    // Calculate direction to target
    const direction = Vector2.subtract(this.target.position, this.position);
    const distance = direction.length();

    if (distance > 1) {
      // Normalize direction and apply speed
      direction.normalize().multiply(this.speed);
      this.velocity = direction;
    } else {
      // Very close to target, stop
      this.velocity.set(0, 0);
    }
  }



  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    
    // Render animated sprite
    this.walkAnimation.render(ctx, this.position.x, this.position.y, this.size, this.size);
    
    ctx.restore();
  }

  // Update canvas dimensions when window resizes (no longer needed since collision system handles boundaries)
  updateCanvasDimensions(_width: number, _height: number): void {
    // Canvas dimensions are now handled by the collision system
  }

  // Get current target for debugging
  getTarget(): Walker | null {
    return this.target;
  }

  // Check if zombie is close enough to attack a walker
  canAttack(walker: Walker): boolean {
    const currentTime = performance.now();
    return this.attackSystem.canAttack(this, walker, this.attackConfig, currentTime);
  }

  // Perform attack on walker if possible
  performAttack(walker: Walker): boolean {
    const currentTime = performance.now();
    return this.attackSystem.performAttack(this, walker, this.attackConfig, currentTime);
  }

  // Check if zombie is within attack range (regardless of cooldown)
  isInAttackRange(walker: Walker): boolean {
    return this.attackSystem.isInRange(this, walker, this.attackConfig);
  }

  // Update zombie speed based on upgrades
  updateSpeed(speedMultiplier: number): void {
    this.speed = this.baseSpeed * speedMultiplier;
  }
}