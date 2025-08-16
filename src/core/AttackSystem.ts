// Attack system for managing combat interactions with proper cooldowns
import { Vector2 } from './Vector2.ts';

export interface Attacker {
  position: Vector2;
  size: number;
  active: boolean;
  lastAttackTime?: number;
}

export interface Target {
  position: Vector2;
  size: number;
  active: boolean;
  takeDamage(damage: number): boolean;
}

export interface AttackConfig {
  damage: number;
  range: number;
  cooldown: number; // in milliseconds
}

export class AttackSystem {
  private static instance: AttackSystem;
  
  private constructor() {}
  
  public static getInstance(): AttackSystem {
    if (!AttackSystem.instance) {
      AttackSystem.instance = new AttackSystem();
    }
    return AttackSystem.instance;
  }

  // Check if attacker can attack target based on range and cooldown
  public canAttack(attacker: Attacker, target: Target, config: AttackConfig, currentTime: number): boolean {
    if (!attacker.active || !target.active) return false;
    
    // Check cooldown
    if (attacker.lastAttackTime !== undefined) {
      const timeSinceLastAttack = currentTime - attacker.lastAttackTime;
      if (timeSinceLastAttack < config.cooldown) {
        return false;
      }
    }
    
    // Check range
    const distance = attacker.position.distanceTo(target.position);
    const attackRange = config.range + (attacker.size + target.size) / 2;
    
    return distance <= attackRange;
  }

  // Perform attack if possible, returns true if attack was successful
  public performAttack(attacker: Attacker, target: Target, config: AttackConfig, currentTime: number): boolean {
    if (!this.canAttack(attacker, target, config, currentTime)) {
      return false;
    }
    
    // Record attack time
    attacker.lastAttackTime = currentTime;
    
    // Deal damage to target
    target.takeDamage(config.damage);
    
    return true;
  }

  // Get remaining cooldown time in milliseconds
  public getRemainingCooldown(attacker: Attacker, config: AttackConfig, currentTime: number): number {
    if (attacker.lastAttackTime === undefined) return 0;
    
    const timeSinceLastAttack = currentTime - attacker.lastAttackTime;
    return Math.max(0, config.cooldown - timeSinceLastAttack);
  }

  // Check if attacker is within attack range (regardless of cooldown)
  public isInRange(attacker: Attacker, target: Target, config: AttackConfig): boolean {
    if (!attacker.active || !target.active) return false;
    
    const distance = attacker.position.distanceTo(target.position);
    const attackRange = config.range + (attacker.size + target.size) / 2;
    
    return distance <= attackRange;
  }

  // Get distance to target minus attack range (negative means in range)
  public getDistanceToRange(attacker: Attacker, target: Target, config: AttackConfig): number {
    const distance = attacker.position.distanceTo(target.position);
    const attackRange = config.range + (attacker.size + target.size) / 2;
    
    return distance - attackRange;
  }
}