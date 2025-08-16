// Settings manager for handling user preferences and accessibility options
export interface GameSettings {
  reducedMotion: boolean;
  soundEnabled: boolean;
  showFPS: boolean;
  autoSave: boolean;
  mobileOptimizations: boolean;
  touchButtonsVisible: boolean;
  highContrastMode: boolean;
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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     window.innerWidth <= 768;
    
    return {
      reducedMotion: false,
      soundEnabled: true,
      showFPS: !isMobile, // Hide FPS on mobile by default
      autoSave: true,
      mobileOptimizations: isMobile,
      touchButtonsVisible: isMobile,
      highContrastMode: false
    };
  }

  // Detect system-level accessibility preferences
  private detectReducedMotionPreference(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      // Reduced motion preference
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        this.settings.reducedMotion = true;
        console.log('System reduced motion preference detected');
      }
      motionQuery.addEventListener('change', (e) => {
        this.settings.reducedMotion = e.matches;
        this.saveSettings();
        console.log(`Reduced motion preference changed: ${e.matches}`);
      });

      // High contrast preference
      const contrastQuery = window.matchMedia('(prefers-contrast: high)');
      if (contrastQuery.matches) {
        this.settings.highContrastMode = true;
        console.log('System high contrast preference detected');
      }
      contrastQuery.addEventListener('change', (e) => {
        this.settings.highContrastMode = e.matches;
        this.saveSettings();
        console.log(`High contrast preference changed: ${e.matches}`);
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

  public isMobileOptimizationsEnabled(): boolean {
    return this.settings.mobileOptimizations;
  }

  public areTouchButtonsVisible(): boolean {
    return this.settings.touchButtonsVisible;
  }

  public isHighContrastModeEnabled(): boolean {
    return this.settings.highContrastMode;
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

  public setMobileOptimizations(enabled: boolean): void {
    this.settings.mobileOptimizations = enabled;
    this.saveSettings();
  }

  public setTouchButtonsVisible(visible: boolean): void {
    this.settings.touchButtonsVisible = visible;
    this.saveSettings();
  }

  public setHighContrastMode(enabled: boolean): void {
    this.settings.highContrastMode = enabled;
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
    this.detectReducedMotionPreference(); // Re-detect system preferences
    this.saveSettings();
  }

  // Get keyboard shortcuts info
  public getKeyboardShortcuts(): { [key: string]: string } {
    const isMobile = this.settings.mobileOptimizations;
    
    if (isMobile) {
      return {
        'Tap screen': 'Spawn zombie',
        'Pause button': 'Pause/Resume game',
        'Upgrade button': 'Toggle upgrade menu',
        'Settings button': 'Toggle reduced motion'
      };
    } else {
      return {
        'P': 'Pause/Resume game',
        'U': 'Toggle upgrade menu',
        'M': 'Toggle reduced motion',
        'F': 'Toggle FPS display',
        'Click/Tap': 'Spawn zombie'
      };
    }
  }

  // Get accessibility information
  public getAccessibilityInfo(): string[] {
    const info: string[] = [];
    
    if (this.settings.reducedMotion) {
      info.push('Reduced motion enabled');
    }
    
    if (this.settings.highContrastMode) {
      info.push('High contrast mode enabled');
    }
    
    if (this.settings.mobileOptimizations) {
      info.push('Mobile optimizations enabled');
    }
    
    if (this.settings.touchButtonsVisible) {
      info.push('Touch buttons visible');
    }
    
    return info;
  }
}