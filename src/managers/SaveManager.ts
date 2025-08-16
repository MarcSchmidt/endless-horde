// Comprehensive save manager for persistent game state
export interface GameSaveData {
  // Resource data
  souls: number;
  walkersDefeated: number;
  
  // Area progression
  currentArea: number;
  
  // Upgrade data
  upgrades: { [key: string]: { level: number; baseCost: number; costMultiplier: number } };
  
  // Metadata
  saveVersion: number;
  lastSaved: number;
}

export class SaveManager {
  private readonly SAVE_KEY = 'endless-horde-complete-save';
  private readonly SAVE_VERSION = 1;

  // Save complete game state
  saveGameState(gameState: Partial<GameSaveData>): boolean {
    try {
      const currentSave = this.loadGameState();
      
      const saveData: GameSaveData = {
        souls: gameState.souls ?? currentSave?.souls ?? 0,
        walkersDefeated: gameState.walkersDefeated ?? currentSave?.walkersDefeated ?? 0,
        currentArea: gameState.currentArea ?? currentSave?.currentArea ?? 0,
        upgrades: gameState.upgrades ?? currentSave?.upgrades ?? {},
        saveVersion: this.SAVE_VERSION,
        lastSaved: Date.now()
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.log('Game state saved successfully');
      return true;
    } catch (error) {
      console.warn('Failed to save game state:', error);
      return false;
    }
  }

  // Load complete game state
  loadGameState(): GameSaveData | null {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (!saved) {
        return null;
      }

      const saveData = JSON.parse(saved) as GameSaveData;
      
      // Validate save version
      if (saveData.saveVersion !== this.SAVE_VERSION) {
        console.warn('Save version mismatch, migrating save data');
        return this.migrateSaveData(saveData);
      }

      return saveData;
    } catch (error) {
      console.warn('Failed to load game state:', error);
      return null;
    }
  }

  // Migrate old save data to new format
  private migrateSaveData(_oldSave: any): GameSaveData | null {
    try {
      // Try to migrate from individual localStorage keys
      const legacyResourceSave = localStorage.getItem('endless-horde-save');
      const legacyUpgradeSave = localStorage.getItem('endless-horde-upgrades');
      const legacyAreaSave = localStorage.getItem('endless-horde-area');

      const migratedSave: GameSaveData = {
        souls: 0,
        walkersDefeated: 0,
        currentArea: 0,
        upgrades: {},
        saveVersion: this.SAVE_VERSION,
        lastSaved: Date.now()
      };

      // Migrate resource data
      if (legacyResourceSave) {
        const resourceData = JSON.parse(legacyResourceSave);
        migratedSave.souls = resourceData.souls || 0;
        migratedSave.walkersDefeated = resourceData.walkersDefeated || 0;
      }

      // Migrate upgrade data
      if (legacyUpgradeSave) {
        const upgradeData = JSON.parse(legacyUpgradeSave);
        migratedSave.upgrades = upgradeData;
      }

      // Migrate area data
      if (legacyAreaSave) {
        const areaData = JSON.parse(legacyAreaSave);
        migratedSave.currentArea = areaData.currentArea || 0;
      }

      // Save migrated data
      this.saveGameState(migratedSave);
      
      // Clean up old save keys
      localStorage.removeItem('endless-horde-save');
      localStorage.removeItem('endless-horde-upgrades');
      localStorage.removeItem('endless-horde-area');

      console.log('Successfully migrated save data to new format');
      return migratedSave;
    } catch (error) {
      console.warn('Failed to migrate save data:', error);
      return null;
    }
  }

  // Check if save data exists
  hasSaveData(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  // Delete save data
  deleteSaveData(): boolean {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      // Also clean up any legacy save keys
      localStorage.removeItem('endless-horde-save');
      localStorage.removeItem('endless-horde-upgrades');
      localStorage.removeItem('endless-horde-area');
      console.log('Save data deleted successfully');
      return true;
    } catch (error) {
      console.warn('Failed to delete save data:', error);
      return false;
    }
  }

  // Export save data as JSON string (for backup/sharing)
  exportSaveData(): string | null {
    try {
      const saveData = this.loadGameState();
      if (!saveData) {
        return null;
      }
      return JSON.stringify(saveData, null, 2);
    } catch (error) {
      console.warn('Failed to export save data:', error);
      return null;
    }
  }

  // Import save data from JSON string
  importSaveData(jsonData: string): boolean {
    try {
      const saveData = JSON.parse(jsonData) as GameSaveData;
      
      // Basic validation
      if (typeof saveData.souls !== 'number' || 
          typeof saveData.walkersDefeated !== 'number' ||
          typeof saveData.currentArea !== 'number') {
        throw new Error('Invalid save data format');
      }

      return this.saveGameState(saveData);
    } catch (error) {
      console.warn('Failed to import save data:', error);
      return false;
    }
  }

  // Get save metadata
  getSaveMetadata(): { lastSaved: Date; saveVersion: number } | null {
    const saveData = this.loadGameState();
    if (!saveData) {
      return null;
    }

    return {
      lastSaved: new Date(saveData.lastSaved),
      saveVersion: saveData.saveVersion
    };
  }
}