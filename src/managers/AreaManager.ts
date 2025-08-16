// Area manager for handling area progression and configuration
export interface AreaConfig {
  id: number;
  name: string;
  walkerHealth: number;
  walkerSpeed: number;
  soulMultiplier: number;
  unlockRequirement: number;
  backgroundColor: string;
  walkerColors: string[];
}

export class AreaManager {
  private currentArea: number = 0;
  private readonly areas: AreaConfig[] = [
    {
      id: 0,
      name: "Peaceful Village",
      walkerHealth: 1,
      walkerSpeed: 50,
      soulMultiplier: 1,
      unlockRequirement: 0,
      backgroundColor: "#87CEEB",
      walkerColors: ['#ff6b6b', '#4ecdc4', '#45b7d1']
    },
    {
      id: 1,
      name: "Busy Town",
      walkerHealth: 2,
      walkerSpeed: 75,
      soulMultiplier: 2,
      unlockRequirement: 25,
      backgroundColor: "#DDA0DD",
      walkerColors: ['#96ceb4', '#feca57', '#ff9ff3']
    },
    {
      id: 2,
      name: "Fortified City",
      walkerHealth: 4,
      walkerSpeed: 100,
      soulMultiplier: 4,
      unlockRequirement: 100,
      backgroundColor: "#F0E68C",
      walkerColors: ['#54a0ff', '#5f27cd', '#00d2d3']
    },
    {
      id: 3,
      name: "Military Base",
      walkerHealth: 8,
      walkerSpeed: 125,
      soulMultiplier: 8,
      unlockRequirement: 250,
      backgroundColor: "#CD853F",
      walkerColors: ['#2d3436', '#636e72', '#74b9ff']
    },
    {
      id: 4,
      name: "Fortress Capital",
      walkerHealth: 16,
      walkerSpeed: 150,
      soulMultiplier: 16,
      unlockRequirement: 500,
      backgroundColor: "#8B4513",
      walkerColors: ['#e17055', '#fdcb6e', '#6c5ce7']
    }
  ];

  constructor() {
    this.loadFromStorage();
  }

  // Get current area configuration
  getCurrentArea(): AreaConfig {
    return this.areas[this.currentArea];
  }

  // Get area by ID
  getArea(areaId: number): AreaConfig | null {
    return this.areas.find(area => area.id === areaId) || null;
  }

  // Get all available areas
  getAllAreas(): AreaConfig[] {
    return [...this.areas];
  }

  // Check if an area is unlocked based on walkers defeated
  isAreaUnlocked(areaId: number, walkersDefeated: number): boolean {
    const area = this.getArea(areaId);
    if (!area) return false;
    return walkersDefeated >= area.unlockRequirement;
  }

  // Get the highest unlocked area based on walkers defeated
  getHighestUnlockedArea(walkersDefeated: number): number {
    let highestUnlocked = 0;
    for (const area of this.areas) {
      if (walkersDefeated >= area.unlockRequirement) {
        highestUnlocked = area.id;
      } else {
        break;
      }
    }
    return highestUnlocked;
  }

  // Set current area (if unlocked)
  setCurrentArea(areaId: number, walkersDefeated: number): boolean {
    if (this.isAreaUnlocked(areaId, walkersDefeated)) {
      this.currentArea = areaId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Get current area ID
  getCurrentAreaId(): number {
    return this.currentArea;
  }

  // Get progress toward next area unlock
  getProgressToNextArea(walkersDefeated: number): { current: number; required: number; percentage: number } | null {
    const nextAreaId = this.currentArea + 1;
    const nextArea = this.getArea(nextAreaId);
    
    if (!nextArea) {
      return null; // No next area
    }

    const current = walkersDefeated;
    const required = nextArea.unlockRequirement;
    const percentage = Math.min((current / required) * 100, 100);

    return { current, required, percentage };
  }

  // Check if there's a next area available
  hasNextArea(): boolean {
    return this.currentArea < this.areas.length - 1;
  }

  // Auto-advance to highest unlocked area
  autoAdvanceArea(walkersDefeated: number): boolean {
    const highestUnlocked = this.getHighestUnlockedArea(walkersDefeated);
    if (highestUnlocked > this.currentArea) {
      this.currentArea = highestUnlocked;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const areaState = {
        currentArea: this.currentArea
      };
      localStorage.setItem('endless-horde-area', JSON.stringify(areaState));
    } catch (error) {
      console.warn('Failed to save area state:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('endless-horde-area');
      if (saved) {
        const areaState = JSON.parse(saved);
        this.currentArea = areaState.currentArea || 0;
      }
    } catch (error) {
      console.warn('Failed to load area state, using defaults:', error);
      this.currentArea = 0;
    }
  }

  // Reset area progression (for testing)
  reset(): void {
    this.currentArea = 0;
    this.saveToStorage();
  }
}