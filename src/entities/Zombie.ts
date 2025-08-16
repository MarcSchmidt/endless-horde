// Zombie entity that seeks and attacks walkers
import { Entity } from '../core/Entity.ts';
import { Vector2 } from '../core/Vector2.ts';
import { Walker } from './Walker.ts';

export class Zombie extends Entity {
  private baseSpeed: number;
  private speed: number;
  private target: Walker | null = null;
  private color: string;
  private size: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private seekRange: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, speedMultiplier: number = 1) {
    super(x, y);
    
    this.baseSpeed = 60; // Base speed - slightly faster than walkers to catch them
    this.speed = this.baseSpeed * speedMultiplier;
    this.size = 10; // Slightly larger than walkers
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.seekRange = 200; // Range to detect walkers
    
    // Zombie color - different shades of red/purple to distinguish from walkers
    const zombieColors = ['#8B0000', '#DC143C', '#B22222', '#800080', '#4B0082'];
    this.color = zombieColors[Math.floor(Math.random() * zombieColors.length)];
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
    } else {
      // No target, stop moving
      this.velocity.set(0, 0);
    }

    // Update position using parent method
    this.update(deltaTime);

    // Keep zombie within bounds
    this.keepInBounds();
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

  private keepInBounds(): void {
    const margin = this.size / 2;
    
    if (this.position.x < margin) {
      this.position.x = margin;
    } else if (this.position.x > this.canvasWidth - margin) {
      this.position.x = this.canvasWidth - margin;
    }
    
    if (this.position.y < margin) {
      this.position.y = margin;
    } else if (this.position.y > this.canvasHeight - margin) {
      this.position.y = this.canvasHeight - margin;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    
    // Draw zombie as a colored rectangle with different shape to distinguish from walkers
    ctx.fillStyle = this.color;
    
    // Draw as a diamond/rotated square to make it visually distinct
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(Math.PI / 4); // 45 degree rotation
    
    ctx.fillRect(
      -this.size / 2, 
      -this.size / 2, 
      this.size, 
      this.size
    );
    
    // Add a border for better visibility
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      -this.size / 2, 
      -this.size / 2, 
      this.size, 
      this.size
    );
    
    ctx.restore();
  }

  // Update canvas dimensions when window resizes
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // Get current target for debugging
  getTarget(): Walker | null {
    return this.target;
  }

  // Check if zombie is close enough to attack a walker
  canAttack(walker: Walker): boolean {
    if (!walker.active) return false;
    
    const distance = this.position.distanceTo(walker.position);
    const attackRange = (this.size + walker.size) / 2 + 2; // Small overlap needed
    
    return distance <= attackRange;
  }

  // Update zombie speed based on upgrades
  updateSpeed(speedMultiplier: number): void {
    this.speed = this.baseSpeed * speedMultiplier;
  }
}