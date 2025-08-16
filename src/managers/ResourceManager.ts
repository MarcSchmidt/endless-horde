// Resource manager for souls currency and game state
import { SaveManager } from './SaveManager.ts';

export class ResourceManager {
  private souls: number = 0;
  private walkersDefeated: number = 0;
  private saveManager: SaveManager;
  
  // Soul values for different walker types (future expansion)
  private readonly baseSoulValue: number = 1;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
    this.loadFromStorage();
  }

  // Award souls for defeating a walker (with area multiplier)
  awardSouls(amount: number = this.baseSoulValue, multiplier: number = 1): void {
    const totalSouls = Math.floor(amount * multiplier);
    this.souls += totalSouls;
    this.walkersDefeated++;
    this.saveToStorage();
  }

  // Spend souls (returns true if successful)
  spendSouls(amount: number): boolean {
    if (this.souls >= amount) {
      this.souls -= amount;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Getters
  getSouls(): number {
    return this.souls;
  }

  getWalkersDefeated(): number {
    return this.walkersDefeated;
  }

  // Set values (for loading from save)
  setSouls(amount: number): void {
    this.souls = Math.max(0, amount);
  }

  setWalkersDefeated(count: number): void {
    this.walkersDefeated = Math.max(0, count);
  }

  // Save to localStorage using SaveManager
  private saveToStorage(): void {
    this.saveManager.saveGameState({
      souls: this.souls,
      walkersDefeated: this.walkersDefeated
    });
  }

  // Load from localStorage using SaveManager
  private loadFromStorage(): void {
    const saveData = this.saveManager.loadGameState();
    if (saveData) {
      this.souls = saveData.souls || 0;
      this.walkersDefeated = saveData.walkersDefeated || 0;
    }
  }

  // Reset game state (for testing)
  reset(): void {
    this.souls = 0;
    this.walkersDefeated = 0;
    this.saveToStorage();
  }
}