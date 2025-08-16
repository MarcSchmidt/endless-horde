// Basic Entity class for game objects
import { Vector2 } from './Vector2.ts';

export class Entity {
  public id: string;
  public position: Vector2;
  public velocity: Vector2;
  public active: boolean;

  constructor(x: number = 0, y: number = 0) {
    this.id = this.generateId();
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.active = true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Update entity position based on velocity
  update(deltaTime: number): void {
    if (!this.active) return;
    
    // Convert deltaTime from milliseconds to seconds for consistent movement
    const deltaSeconds = deltaTime / 1000;
    
    // Update position based on velocity
    this.position.add(Vector2.multiply(this.velocity, deltaSeconds));
  }

  // Basic render method (to be overridden by subclasses)
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.position.x - 5, this.position.y - 5, 10, 10);
    ctx.restore();
  }

  // Check if entity is within bounds
  isInBounds(width: number, height: number): boolean {
    return this.position.x >= 0 && 
           this.position.x <= width && 
           this.position.y >= 0 && 
           this.position.y <= height;
  }

  // Destroy this entity
  destroy(): void {
    this.active = false;
  }
}