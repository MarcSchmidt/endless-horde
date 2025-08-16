// Collision system for entity separation and boundary management
import { Vector2 } from './Vector2.ts';
import { Entity } from './Entity.ts';

export interface CollisionEntity extends Entity {
  size: number;
}

export class CollisionSystem {
  private static instance: CollisionSystem;
  
  private constructor() {}
  
  public static getInstance(): CollisionSystem {
    if (!CollisionSystem.instance) {
      CollisionSystem.instance = new CollisionSystem();
    }
    return CollisionSystem.instance;
  }

  // Apply separation force between entities to prevent overlap
  public applySeparation(entities: CollisionEntity[], separationForce: number = 50): void {
    for (let i = 0; i < entities.length; i++) {
      const entityA = entities[i];
      if (!entityA.active) continue;

      const separationVector = new Vector2(0, 0);
      let neighborCount = 0;

      for (let j = 0; j < entities.length; j++) {
        if (i === j) continue;
        
        const entityB = entities[j];
        if (!entityB.active) continue;

        const distance = entityA.position.distanceTo(entityB.position);
        const minDistance = (entityA.size + entityB.size) / 2 + 5; // 5px buffer

        if (distance < minDistance && distance > 0) {
          // Calculate separation direction (away from other entity)
          const separationDir = Vector2.subtract(entityA.position, entityB.position);
          separationDir.normalize();
          
          // Stronger separation when entities are closer
          const separationStrength = (minDistance - distance) / minDistance;
          separationDir.multiply(separationStrength);
          
          separationVector.add(separationDir);
          neighborCount++;
        }
      }

      // Apply average separation force
      if (neighborCount > 0) {
        separationVector.multiply(1 / neighborCount);
        separationVector.multiply(separationForce);
        
        // Add to entity's velocity (gradual separation)
        entityA.velocity.add(Vector2.multiply(separationVector, 0.016)); // Assume ~60fps
      }
    }
  }

  // Keep entity within canvas bounds with soft boundary collision
  public applyBoundaryCollision(entity: CollisionEntity, canvasWidth: number, canvasHeight: number, bounceForce: number = 100): void {
    if (!entity.active) return;

    const margin = entity.size / 2;
    const softBoundary = 20; // Start applying force 20px before boundary
    
    // Left boundary
    if (entity.position.x < margin + softBoundary) {
      const penetration = (margin + softBoundary) - entity.position.x;
      const force = Math.min(penetration / softBoundary, 1) * bounceForce;
      entity.velocity.x += force * 0.016; // Apply force over time
      
      // Hard boundary - don't allow going outside
      if (entity.position.x < margin) {
        entity.position.x = margin;
        entity.velocity.x = Math.max(0, entity.velocity.x); // Remove negative velocity
      }
    }
    
    // Right boundary
    if (entity.position.x > canvasWidth - margin - softBoundary) {
      const penetration = entity.position.x - (canvasWidth - margin - softBoundary);
      const force = Math.min(penetration / softBoundary, 1) * bounceForce;
      entity.velocity.x -= force * 0.016;
      
      // Hard boundary
      if (entity.position.x > canvasWidth - margin) {
        entity.position.x = canvasWidth - margin;
        entity.velocity.x = Math.min(0, entity.velocity.x); // Remove positive velocity
      }
    }
    
    // Top boundary
    if (entity.position.y < margin + softBoundary) {
      const penetration = (margin + softBoundary) - entity.position.y;
      const force = Math.min(penetration / softBoundary, 1) * bounceForce;
      entity.velocity.y += force * 0.016;
      
      // Hard boundary
      if (entity.position.y < margin) {
        entity.position.y = margin;
        entity.velocity.y = Math.max(0, entity.velocity.y);
      }
    }
    
    // Bottom boundary
    if (entity.position.y > canvasHeight - margin - softBoundary) {
      const penetration = entity.position.y - (canvasHeight - margin - softBoundary);
      const force = Math.min(penetration / softBoundary, 1) * bounceForce;
      entity.velocity.y -= force * 0.016;
      
      // Hard boundary
      if (entity.position.y > canvasHeight - margin) {
        entity.position.y = canvasHeight - margin;
        entity.velocity.y = Math.min(0, entity.velocity.y);
      }
    }
  }

  // Check if two entities are colliding
  public areColliding(entityA: CollisionEntity, entityB: CollisionEntity): boolean {
    if (!entityA.active || !entityB.active) return false;
    
    const distance = entityA.position.distanceTo(entityB.position);
    const minDistance = (entityA.size + entityB.size) / 2;
    
    return distance <= minDistance;
  }

  // Get collision distance between two entities
  public getCollisionDistance(entityA: CollisionEntity, entityB: CollisionEntity): number {
    const distance = entityA.position.distanceTo(entityB.position);
    const minDistance = (entityA.size + entityB.size) / 2;
    
    return Math.max(0, minDistance - distance);
  }
}