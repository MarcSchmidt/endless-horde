// Walker entity that moves randomly across the screen
import { Entity } from '../core/Entity.ts';
import { Vector2 } from '../core/Vector2.ts';
import { AreaConfig } from '../managers/AreaManager.ts';
import { Animation } from '../core/Animation.ts';

export class Walker extends Entity {
  private speed: number;
  private baseSpeed: number;
  private targetPosition: Vector2;
  private _size: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private retargetTimer: number;
  private retargetInterval: number;
  
  // Area-based properties
  private _health: number;
  private _maxHealth: number;
  private _soulValue: number;
  private areaLevel: number;
  
  // Animation properties
  private walkAnimation: Animation;
  private isMoving: boolean = false;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, areaConfig?: AreaConfig) {
    super(x, y);
    
    // Set area-based properties
    if (areaConfig) {
      this.baseSpeed = areaConfig.walkerSpeed;
      this._health = areaConfig.walkerHealth;
      this._maxHealth = areaConfig.walkerHealth;
      this._soulValue = areaConfig.soulMultiplier;
      this.areaLevel = areaConfig.id;
      
      // Area-specific colors are now handled by sprites
    } else {
      // Default values for backward compatibility
      this.baseSpeed = 50;
      this._health = 1;
      this._maxHealth = 1;
      this._soulValue = 1;
      this.areaLevel = 0;
      
      // Default colors are now handled by sprites
    }
    
    // Add some random variation to speed (±20%)
    this.speed = this.baseSpeed + (Math.random() - 0.5) * this.baseSpeed * 0.4;
    
    this.targetPosition = new Vector2(x, y);
    this._size = 8 + Math.random() * 8; // Random size between 8-16 pixels
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.retargetTimer = 0;
    this.retargetInterval = 2000 + Math.random() * 3000; // Retarget every 2-5 seconds
    
    // Set initial random target
    this.setRandomTarget();
    
    // Initialize animation based on area
    const spriteName = `walker_area_${this.areaLevel + 1}`;
    this.walkAnimation = Animation.createWalkAnimation(spriteName);
  }

  private setRandomTarget(): void {
    // Set a random target position within canvas bounds
    this.targetPosition = Vector2.random(
      this._size, 
      this.canvasWidth - this._size,
      this._size, 
      this.canvasHeight - this._size
    );
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    // Update retarget timer
    this.retargetTimer += deltaTime;
    
    // Check if we need to pick a new target
    if (this.retargetTimer >= this.retargetInterval || 
        this.position.distanceTo(this.targetPosition) < 10) {
      this.setRandomTarget();
      this.retargetTimer = 0;
      this.retargetInterval = 2000 + Math.random() * 3000; // New random interval
    }

    // Calculate direction to target
    const direction = Vector2.subtract(this.targetPosition, this.position);
    const distance = direction.length();
    
    if (distance > 1) {
      // Normalize direction and apply speed
      direction.normalize().multiply(this.speed);
      this.velocity = direction;
      this.isMoving = true;
    } else {
      // Stop if very close to target
      this.velocity.set(0, 0);
      this.isMoving = false;
    }

    // Update position
    super.update(deltaTime);

    // Update animation
    if (this.isMoving) {
      this.walkAnimation.play();
    } else {
      this.walkAnimation.pause();
    }
    this.walkAnimation.update(deltaTime);

    // Keep walker within bounds
    this.keepInBounds();
  }

  private keepInBounds(): void {
    const margin = this._size / 2;
    
    if (this.position.x < margin) {
      this.position.x = margin;
      this.setRandomTarget();
    } else if (this.position.x > this.canvasWidth - margin) {
      this.position.x = this.canvasWidth - margin;
      this.setRandomTarget();
    }
    
    if (this.position.y < margin) {
      this.position.y = margin;
      this.setRandomTarget();
    } else if (this.position.y > this.canvasHeight - margin) {
      this.position.y = this.canvasHeight - margin;
      this.setRandomTarget();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    
    // Render animated sprite
    this.walkAnimation.render(ctx, this.position.x, this.position.y, this._size, this._size);
    
    // Draw health bar for walkers with more than 1 max health
    if (this._maxHealth > 1) {
      const healthBarWidth = this._size;
      const healthBarHeight = 3;
      const healthBarY = this.position.y - this._size / 2 - 6;
      
      // Background
      ctx.fillStyle = '#333';
      ctx.fillRect(
        this.position.x - healthBarWidth / 2,
        healthBarY,
        healthBarWidth,
        healthBarHeight
      );
      
      // Health bar
      const healthPercentage = this.getHealthPercentage();
      const healthColor = healthPercentage > 0.6 ? '#4CAF50' : 
                         healthPercentage > 0.3 ? '#FF9800' : '#F44336';
      
      ctx.fillStyle = healthColor;
      ctx.fillRect(
        this.position.x - healthBarWidth / 2,
        healthBarY,
        healthBarWidth * healthPercentage,
        healthBarHeight
      );
    }
    
    ctx.restore();
  }

  // Update canvas dimensions when window resizes
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Ensure current target is still valid
    if (!this.isTargetInBounds()) {
      this.setRandomTarget();
    }
  }

  private isTargetInBounds(): boolean {
    const margin = this._size / 2;
    return this.targetPosition.x >= margin && 
           this.targetPosition.x <= this.canvasWidth - margin &&
           this.targetPosition.y >= margin && 
           this.targetPosition.y <= this.canvasHeight - margin;
  }

  // Getter for size (needed for collision detection)
  get size(): number {
    return this._size;
  }

  // Health management
  get health(): number {
    return this._health;
  }

  get maxHealth(): number {
    return this._maxHealth;
  }

  get soulValue(): number {
    return this._soulValue;
  }

  get areaId(): number {
    return this.areaLevel;
  }

  // Take damage and return true if walker is defeated
  takeDamage(damage: number = 1): boolean {
    this._health -= damage;
    if (this._health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  // Check if walker is at full health
  isFullHealth(): boolean {
    return this._health >= this._maxHealth;
  }

  // Get health percentage for visual effects
  getHealthPercentage(): number {
    return this._health / this._maxHealth;
  }

  // Update walker sprite when area changes
  updateAreaSprite(areaId: number): void {
    this.areaLevel = areaId;
    const spriteName = `walker_area_${areaId + 1}`;
    this.walkAnimation.setSprite(spriteName);
  }
}