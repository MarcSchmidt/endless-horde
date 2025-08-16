// Entity culling system for performance optimization
import { Entity } from './Entity.ts';
import { PerformanceMonitor } from './PerformanceMonitor.ts';

export interface CullableEntity extends Entity {
  lastUpdateTime?: number;
  priority?: number; // Higher priority = less likely to be culled
}

export class EntityCuller {
  private static instance: EntityCuller;
  private performanceMonitor: PerformanceMonitor;
  
  // Culling parameters
  private readonly VIEWPORT_MARGIN = 50; // Extra margin around viewport for culling
  private readonly UPDATE_SKIP_DISTANCE = 200; // Distance at which to skip updates
  // private readonly PRIORITY_CULL_THRESHOLD = 0.1; // Only cull lowest 10% priority entities

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): EntityCuller {
    if (!EntityCuller.instance) {
      EntityCuller.instance = new EntityCuller();
    }
    return EntityCuller.instance;
  }

  // Cull entities based on viewport and performance
  cullEntities<T extends CullableEntity>(
    entities: T[], 
    viewportWidth: number, 
    viewportHeight: number,
    maxEntities?: number
  ): T[] {
    if (!this.performanceMonitor.shouldCullEntities() && !maxEntities) {
      return entities;
    }

    const activeEntities = entities.filter(entity => entity.active);
    const maxCount = maxEntities || this.performanceMonitor.getMaxEntities();
    
    if (activeEntities.length <= maxCount) {
      return activeEntities;
    }

    // First pass: Remove entities outside viewport with margin
    const viewportEntities = activeEntities.filter(entity => 
      this.isInViewport(entity, viewportWidth, viewportHeight)
    );

    // If still too many, prioritize by distance from center and priority
    if (viewportEntities.length > maxCount) {
      return this.priorityCull(viewportEntities, viewportWidth, viewportHeight, maxCount);
    }

    return viewportEntities;
  }

  // Check if entity is within viewport bounds (with margin)
  private isInViewport(entity: CullableEntity, viewportWidth: number, viewportHeight: number): boolean {
    const margin = this.VIEWPORT_MARGIN;
    return entity.position.x >= -margin &&
           entity.position.x <= viewportWidth + margin &&
           entity.position.y >= -margin &&
           entity.position.y <= viewportHeight + margin;
  }

  // Cull entities based on priority and distance from viewport center
  private priorityCull<T extends CullableEntity>(
    entities: T[], 
    viewportWidth: number, 
    viewportHeight: number, 
    maxCount: number
  ): T[] {
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    // Calculate scores for each entity (higher score = more important)
    const scoredEntities = entities.map(entity => {
      const distanceFromCenter = Math.sqrt(
        Math.pow(entity.position.x - centerX, 2) + 
        Math.pow(entity.position.y - centerY, 2)
      );
      
      // Normalize distance (closer = higher score)
      const maxDistance = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
      const distanceScore = 1 - (distanceFromCenter / maxDistance);
      
      // Priority score (default to 0.5 if not set)
      const priorityScore = entity.priority || 0.5;
      
      // Combined score
      const score = distanceScore * 0.7 + priorityScore * 0.3;
      
      return { entity, score };
    });

    // Sort by score (highest first) and take top entities
    scoredEntities.sort((a, b) => b.score - a.score);
    return scoredEntities.slice(0, maxCount).map(item => item.entity);
  }

  // Determine if entity should skip update based on distance and performance
  shouldSkipUpdate(entity: CullableEntity, viewportWidth: number, viewportHeight: number): boolean {
    const updateFrequency = this.performanceMonitor.getEntityUpdateFrequency();
    
    // Always update if performance is good
    if (updateFrequency >= 1.0) {
      return false;
    }

    // Skip based on update frequency
    if (Math.random() > updateFrequency) {
      return true;
    }

    // Skip distant entities more often
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const distance = Math.sqrt(
      Math.pow(entity.position.x - centerX, 2) + 
      Math.pow(entity.position.y - centerY, 2)
    );

    if (distance > this.UPDATE_SKIP_DISTANCE) {
      // Skip distant entities more frequently
      const skipChance = Math.min(0.8, (distance - this.UPDATE_SKIP_DISTANCE) / this.UPDATE_SKIP_DISTANCE);
      return Math.random() < skipChance;
    }

    return false;
  }

  // Cull particles based on performance and age
  cullParticles<T extends { life: number; maxLife: number; x: number; y: number }>(
    particles: T[],
    viewportWidth: number,
    viewportHeight: number
  ): T[] {
    if (!this.performanceMonitor.shouldCullParticles()) {
      return particles;
    }

    const maxParticles = this.performanceMonitor.getMaxParticles();
    
    if (particles.length <= maxParticles) {
      return particles;
    }

    // Sort by remaining life (oldest first) and viewport distance
    const scoredParticles = particles.map(particle => {
      const lifeRatio = particle.life / particle.maxLife;
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const distance = Math.sqrt(
        Math.pow(particle.x - centerX, 2) + 
        Math.pow(particle.y - centerY, 2)
      );
      
      // Score: higher life ratio and closer to center = higher score
      const maxDistance = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
      const distanceScore = 1 - (distance / maxDistance);
      const score = lifeRatio * 0.6 + distanceScore * 0.4;
      
      return { particle, score };
    });

    // Sort by score and keep the best ones
    scoredParticles.sort((a, b) => b.score - a.score);
    return scoredParticles.slice(0, maxParticles).map(item => item.particle);
  }

  // Set entity priority (0.0 to 1.0, higher = more important)
  setEntityPriority(entity: CullableEntity, priority: number): void {
    entity.priority = Math.max(0, Math.min(1, priority));
  }
}