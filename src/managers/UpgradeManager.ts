// Upgrade manager for handling upgrade levels and effects
import { SaveManager } from './SaveManager.ts';

export interface UpgradeData {
  level: number;
  baseCost: number;
  costMultiplier: number;
}

export class UpgradeManager {
  private upgrades: Map<string, UpgradeData> = new Map();
  private saveManager: SaveManager;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
    this.initializeUpgrades();
    this.loadFromStorage();
  }

  private initializeUpgrades(): void {
    // Initialize upgrade data
    this.upgrades.set('zombie-speed', {
      level: 0,
      baseCost: 10,
      costMultiplier: 1.5
    });

    this.upgrades.set('max-zombies', {
      level: 0,
      baseCost: 25,
      costMultiplier: 1.5
    });
  }

  // Get current upgrade level
  getUpgradeLevel(upgradeId: string): number {
    const upgrade = this.upgrades.get(upgradeId);
    return upgrade ? upgrade.level : 0;
  }

  // Get cost for next upgrade level
  getUpgradeCost(upgradeId: string): number {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return 0;
    
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }

  // Purchase an upgrade (returns true if successful)
  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return false;

    upgrade.level++;
    this.saveToStorage();
    return true;
  }

  // Get zombie speed multiplier based on upgrades
  getZombieSpeedMultiplier(): number {
    const speedLevel = this.getUpgradeLevel('zombie-speed');
    return 1 + (speedLevel * 0.2); // 20% speed increase per level
  }

  // Get maximum zombie count based on upgrades
  getMaxZombies(): number {
    const maxZombieLevel = this.getUpgradeLevel('max-zombies');
    return 10 + (maxZombieLevel * 5); // Base 10, +5 per level
  }

  // Load upgrade data from save
  loadUpgradeData(upgradeData: { [key: string]: UpgradeData }): void {
    for (const [key, value] of Object.entries(upgradeData)) {
      if (this.upgrades.has(key)) {
        this.upgrades.set(key, value);
      }
    }
  }

  // Get all upgrade data for saving
  getUpgradeData(): { [key: string]: UpgradeData } {
    const upgradeState: { [key: string]: UpgradeData } = {};
    for (const [key, value] of this.upgrades) {
      upgradeState[key] = value;
    }
    return upgradeState;
  }

  // Save to localStorage using SaveManager
  private saveToStorage(): void {
    this.saveManager.saveGameState({
      upgrades: this.getUpgradeData()
    });
  }

  // Load from localStorage using SaveManager
  private loadFromStorage(): void {
    const saveData = this.saveManager.loadGameState();
    if (saveData && saveData.upgrades) {
      this.loadUpgradeData(saveData.upgrades);
    }
  }

  // Reset all upgrades (for testing)
  reset(): void {
    this.initializeUpgrades();
    this.saveToStorage();
  }
}