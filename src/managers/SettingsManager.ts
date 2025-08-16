// Settings manager for handling user preferences and accessibility options
export interface GameSettings {
  reducedMotion: boolean;
  soundEnabled: boolean;
  showFPS: boolean;
  autoSave: boolean;
}

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: GameSettings;
  private readonly STORAGE_KEY = 'endless-horde-settings';

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
    this.detectReducedMotionPreference();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private getDefaultSettings(): GameSettings {
    return {
      reducedMotion: false,
      soundEnabled: true,
      showFPS: true,
      autoSave: true
    };
  }

  // Detect system-level reduced motion preference
  private detectReducedMotionPreference(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      // Set initial value
      if (mediaQuery.matches) {
        this.settings.reducedMotion = true;
        console.log('System reduced motion preference detected');
      }

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.settings.reducedMotion = e.matches;
        this.saveSettings();
        console.log(`Reduced motion preference changed: ${e.matches}`);
      });
    }
  }

  // Load settings from localStorage
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...this.getDefaultSettings(), ...parsedSettings };
        console.log('Settings loaded from localStorage');
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }

  // Getters
  public isReducedMotionEnabled(): boolean {
    return this.settings.reducedMotion;
  }

  public isSoundEnabled(): boolean {
    return this.settings.soundEnabled;
  }

  public shouldShowFPS(): boolean {
    return this.settings.showFPS;
  }

  public isAutoSaveEnabled(): boolean {
    return this.settings.autoSave;
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  // Setters
  public setReducedMotion(enabled: boolean): void {
    this.settings.reducedMotion = enabled;
    this.saveSettings();
  }

  public setSoundEnabled(enabled: boolean): void {
    this.settings.soundEnabled = enabled;
    this.saveSettings();
  }

  public setShowFPS(enabled: boolean): void {
    this.settings.showFPS = enabled;
    this.saveSettings();
  }

  public setAutoSave(enabled: boolean): void {
    this.settings.autoSave = enabled;
    this.saveSettings();
  }

  // Update multiple settings at once
  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Reset to defaults
  public resetToDefaults(): void {
    this.settings = this.getDefaultSettings();
    this.detectReducedMotionPreference(); // Re-detect system preference
    this.saveSettings();
  }

  // Get keyboard shortcuts info
  public getKeyboardShortcuts(): { [key: string]: string } {
    return {
      'P': 'Pause/Resume game',
      'U': 'Toggle upgrade menu',
      'M': 'Toggle reduced motion',
      'F': 'Toggle FPS display',
      'Click/Tap': 'Spawn zombie'
    };
  }
}