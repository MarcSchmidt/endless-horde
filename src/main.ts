// Main entry point for Endless Horde game
import { WalkerSystem } from './systems/WalkerSystem.ts';
import { ZombieSystem } from './systems/ZombieSystem.ts';
import { InputManager } from './systems/InputManager.ts';
import { ResourceManager } from './managers/ResourceManager.ts';
import { UpgradeManager } from './managers/UpgradeManager.ts';
import { AreaManager } from './managers/AreaManager.ts';
import { SaveManager } from './managers/SaveManager.ts';
import { SettingsManager } from './managers/SettingsManager.ts';
import { AssetManager } from './core/AssetManager.ts';
import { Animation } from './core/Animation.ts';
import { VisualEffects } from './core/VisualEffects.ts';
import { HUD } from './ui/HUD.ts';
import { MobileUI } from './ui/MobileUI.ts';
import { AccessibilityManager } from './managers/AccessibilityManager.ts';
import { PerformanceMonitor, PerformanceLevel } from './core/PerformanceMonitor.ts';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private devicePixelRatio: number;
  
  // Game loop properties
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedTimeStep: number = 1000 / 60; // 60 FPS fixed timestep
  private animationId: number = 0;
  
  // Game state
  private isPaused: boolean = false;
  private lastPauseKeyState: boolean = false;
  private lastUpgradeKeyState: boolean = false;
  private lastMotionKeyState: boolean = false;
  
  // FPS tracking
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsLastTime: number = 0;
  
  // Game systems
  private walkerSystem!: WalkerSystem;
  private zombieSystem!: ZombieSystem;
  private inputManager!: InputManager;
  private resourceManager!: ResourceManager;
  private upgradeManager!: UpgradeManager;
  private areaManager!: AreaManager;
  private saveManager!: SaveManager;
  private settingsManager!: SettingsManager;
  private assetManager!: AssetManager;
  private visualEffects!: VisualEffects;
  private hud!: HUD;
  private mobileUI!: MobileUI;
  private accessibilityManager!: AccessibilityManager;
  private performanceMonitor!: PerformanceMonitor;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = context;

    // Handle device pixel ratio for crisp rendering
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.setupCanvas();
    this.setupInput();
    this.initializeAssets().then(() => {
      this.initializeSystems();
      this.startGameLoop();
    }).catch(error => {
      console.error('Failed to initialize assets:', error);
      // Continue with fallback rendering
      this.initializeSystems();
      this.startGameLoop();
    });
  }

  private setupCanvas(): void {
    // Get viewport dimensions with mobile-friendly sizing
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
    
    let viewportWidth: number;
    let viewportHeight: number;
    
    if (isMobile) {
      // On mobile, use more of the screen space and account for safe areas
      const safeAreaTop = this.getSafeAreaInset('top');
      const safeAreaBottom = this.getSafeAreaInset('bottom');
      const safeAreaLeft = this.getSafeAreaInset('left');
      const safeAreaRight = this.getSafeAreaInset('right');
      
      viewportWidth = window.innerWidth - safeAreaLeft - safeAreaRight - 10;
      viewportHeight = window.innerHeight - safeAreaTop - safeAreaBottom - 60; // Account for title
      
      // Ensure minimum size for playability
      viewportWidth = Math.max(320, viewportWidth);
      viewportHeight = Math.max(240, viewportHeight);
    } else {
      // Desktop sizing
      viewportWidth = Math.min(window.innerWidth - 40, 800);
      viewportHeight = Math.min(window.innerHeight - 120, 600);
    }
    
    // Maintain aspect ratio while fitting screen
    const targetAspectRatio = 4 / 3; // 800x600 ratio
    const screenAspectRatio = viewportWidth / viewportHeight;
    
    if (screenAspectRatio > targetAspectRatio) {
      // Screen is wider than target, constrain by height
      viewportWidth = viewportHeight * targetAspectRatio;
    } else {
      // Screen is taller than target, constrain by width
      viewportHeight = viewportWidth / targetAspectRatio;
    }
    
    // Ensure canvas doesn't exceed screen bounds
    viewportWidth = Math.min(viewportWidth, window.innerWidth - 20);
    viewportHeight = Math.min(viewportHeight, window.innerHeight - 80);
    
    // Set canvas CSS size
    this.canvas.style.width = viewportWidth + 'px';
    this.canvas.style.height = viewportHeight + 'px';
    
    // Set actual size in memory (scaled for device pixel ratio)
    this.canvas.width = viewportWidth * this.devicePixelRatio;
    this.canvas.height = viewportHeight * this.devicePixelRatio;
    
    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    
    console.log(`Canvas setup: ${viewportWidth}x${viewportHeight} (CSS), ${this.canvas.width}x${this.canvas.height} (actual), DPR: ${this.devicePixelRatio}`);
  }

  private getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
    // Try to get CSS safe area insets if available
    const style = getComputedStyle(document.documentElement);
    const safeAreaValue = style.getPropertyValue(`env(safe-area-inset-${side})`);
    
    if (safeAreaValue && safeAreaValue !== 'env(safe-area-inset-' + side + ')') {
      const pixels = parseInt(safeAreaValue);
      return isNaN(pixels) ? 0 : pixels;
    }

    // Fallback estimates for common devices
    const userAgent = navigator.userAgent;
    if (/iPhone/.test(userAgent)) {
      switch (side) {
        case 'top': return 44; // Status bar + notch
        case 'bottom': return 34; // Home indicator
        default: return 0;
      }
    }

    return 0;
  }

  private setupInput(): void {
    let resizeTimeout: number | null = null;
    
    // Handle window resize with debouncing for better performance
    window.addEventListener('resize', () => {
      // Clear existing timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Debounce resize events to avoid excessive recalculations
      resizeTimeout = window.setTimeout(() => {
        this.handleResize();
      }, 150);
    });

    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        this.handleResize();
      }, 500);
    });

    // Handle visibility change (app backgrounding/foregrounding)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App is being backgrounded, pause if not already paused
        if (!this.isPaused) {
          this.togglePause();
          console.log('Auto-paused due to app backgrounding');
        }
      }
    });
  }

  private handleResize(): void {
    console.log('Handling window resize...');
    
    // Store previous canvas dimensions
    const prevWidth = this.canvas.width / this.devicePixelRatio;
    const prevHeight = this.canvas.height / this.devicePixelRatio;
    
    // Update canvas setup
    this.setupCanvas();
    
    // Get new dimensions
    const newWidth = this.canvas.width / this.devicePixelRatio;
    const newHeight = this.canvas.height / this.devicePixelRatio;
    
    // Only update systems if dimensions actually changed
    if (Math.abs(newWidth - prevWidth) > 1 || Math.abs(newHeight - prevHeight) > 1) {
      console.log(`Canvas dimensions changed: ${prevWidth}x${prevHeight} -> ${newWidth}x${newHeight}`);
      
      // Update all systems with new canvas dimensions
      if (this.walkerSystem && this.zombieSystem && this.visualEffects && this.hud && this.mobileUI) {
        this.walkerSystem.updateCanvasDimensions(newWidth, newHeight);
        this.zombieSystem.updateCanvasDimensions(newWidth, newHeight);
        this.visualEffects.updateCanvasDimensions(newWidth, newHeight);
        this.hud.updateCanvasDimensions(newWidth, newHeight);
        this.mobileUI.updateCanvasDimensions(newWidth, newHeight);
        
        // Optimize mobile UI for new dimensions
        this.mobileUI.optimizeForDevice();
        
        // Validate accessibility after resize
        const accessibilityCheck = this.mobileUI.validateAccessibility();
        if (!accessibilityCheck.valid) {
          console.warn('Accessibility issues detected after resize:', accessibilityCheck.issues);
        }
      }
      
      // Announce resize to accessibility manager
      this.accessibilityManager.announce(`Screen resized to ${Math.round(newWidth)} by ${Math.round(newHeight)} pixels`, 'polite');
    }
  }

  private async initializeAssets(): Promise<void> {
    // Initialize asset and settings managers
    this.assetManager = AssetManager.getInstance();
    this.settingsManager = SettingsManager.getInstance();
    
    // Initialize placeholder sprites
    await this.assetManager.initializePlaceholderSprites();
    
    // Set up reduced motion based on settings
    Animation.setReducedMotion(this.settingsManager.isReducedMotionEnabled());
    
    console.log('Assets initialized successfully');
  }

  private initializeSystems(): void {
    const canvasWidth = this.canvas.width / this.devicePixelRatio;
    const canvasHeight = this.canvas.height / this.devicePixelRatio;
    
    // Initialize performance monitor and accessibility manager first
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.accessibilityManager = AccessibilityManager.getInstance();
    
    // Set up performance level change callback
    this.performanceMonitor.onPerformanceLevelChange((level: PerformanceLevel) => {
      console.log(`Performance level changed to: ${level}`);
      this.handlePerformanceLevelChange(level);
    });
    
    // Initialize managers first
    this.saveManager = new SaveManager();
    this.resourceManager = new ResourceManager(this.saveManager);
    this.upgradeManager = new UpgradeManager(this.saveManager);
    this.areaManager = new AreaManager();
    
    // Initialize game systems
    this.walkerSystem = new WalkerSystem(canvasWidth, canvasHeight, this.areaManager);
    this.zombieSystem = new ZombieSystem(canvasWidth, canvasHeight, this.resourceManager, this.upgradeManager, this.areaManager);
    this.inputManager = new InputManager(this.canvas);
    this.visualEffects = new VisualEffects(canvasWidth, canvasHeight);
    this.hud = new HUD(this.resourceManager, this.upgradeManager, this.areaManager, canvasWidth, canvasHeight);
    this.mobileUI = new MobileUI(this.canvas, canvasWidth, canvasHeight);
    
    // Set up upgrade callback
    this.hud.setOnUpgradePurchased((upgradeId: string) => {
      this.handleUpgradePurchased(upgradeId);
    });

    // Set up visual effects callback for walker defeats
    this.zombieSystem.setOnWalkerDefeated((x: number, y: number, color: string) => {
      this.visualEffects.createDeathEffect(x, y, color);
    });

    // Initialize mobile-specific optimizations
    this.initializeMobileOptimizations();

    // Load game state and sync managers
    this.loadGameState();
    
    // Announce game instructions for accessibility
    setTimeout(() => {
      this.accessibilityManager.announceGameInstructions();
    }, 2000);
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? 'Game Paused' : 'Game Resumed');
    
    // Announce state change for accessibility
    this.accessibilityManager.announceGameState(this.isPaused ? 'paused' : 'resumed');
  }

  private toggleReducedMotion(): void {
    const currentSetting = this.settingsManager.isReducedMotionEnabled();
    const newSetting = !currentSetting;
    
    this.settingsManager.setReducedMotion(newSetting);
    Animation.setReducedMotion(newSetting);
    
    console.log(`Reduced motion ${newSetting ? 'enabled' : 'disabled'}`);
  }

  private handleMobileButtonPress(buttonId: string): void {
    this.accessibilityManager.announceMobileAction('touch-button-pressed');
    
    switch (buttonId) {
      case 'pause':
        this.togglePause();
        break;
      case 'upgrades':
        this.hud.toggleUpgradeMenu();
        this.accessibilityManager.announceGameState(
          this.hud.isUpgradeMenuOpen() ? 'upgrade-menu-opened' : 'upgrade-menu-closed'
        );
        break;
      case 'settings':
        this.toggleReducedMotion();
        break;
      default:
        console.log(`Unknown mobile button pressed: ${buttonId}`);
    }
  }

  private handleUpgradePurchased(upgradeId: string): void {
    console.log(`Applying upgrade: ${upgradeId}`);
    
    // Apply upgrade effects immediately
    if (upgradeId === 'zombie-speed') {
      this.zombieSystem.applySpeedUpgrades();
    }
    // max-zombies upgrade is automatically handled by the upgrade manager
  }

  private startGameLoop(): void {
    this.lastTime = performance.now();
    this.fpsLastTime = this.lastTime;
    this.gameLoop(this.lastTime);
  }

  private gameLoop(currentTime: number): void {
    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.updateFPS(currentTime);
    
    // Always update input manager so pause/unpause works
    this.inputManager.update();
    
    // Always handle pause input, even when paused
    this.handlePauseInput();
    
    if (!this.isPaused) {
      // Fixed timestep update loop
      this.accumulator += deltaTime;
      
      while (this.accumulator >= this.fixedTimeStep) {
        this.update(this.fixedTimeStep);
        this.accumulator -= this.fixedTimeStep;
      }
    }
    
    // Always render (even when paused)
    const interpolationFactor = this.accumulator / this.fixedTimeStep;
    this.render(interpolationFactor);
  }

  private updateFPS(currentTime: number): void {
    this.frameCount++;
    
    if (currentTime - this.fpsLastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsLastTime));
      this.frameCount = 0;
      this.fpsLastTime = currentTime;
    }
    
    // Update performance monitor with current metrics
    const totalEntities = this.walkerSystem.getWalkerCount() + this.zombieSystem.getZombieCount();
    const particleCount = this.visualEffects.getParticleCount();
    this.performanceMonitor.updateMetrics(currentTime, totalEntities, particleCount);
  }

  private update(deltaTime: number): void {
    // Handle non-pause input (only when not paused)
    this.handleGameInput();
    
    // Check for area progression
    this.checkAreaProgression();
    
    // Update walker system
    this.walkerSystem.update(deltaTime);
    
    // Update zombie system with walker data for AI targeting
    const activeWalkers = this.walkerSystem.getActiveWalkers();
    this.zombieSystem.update(deltaTime, activeWalkers);
    
    // Update visual effects
    this.visualEffects.update(deltaTime);
    
    // Create ambient particles for current area
    const currentArea = this.areaManager.getCurrentArea();
    this.visualEffects.createAmbientParticles(currentArea);
    
    // Update HUD
    this.hud.update();
  }

  private handlePauseInput(): void {
    // Handle pause toggle (only on key press, not hold) - always active
    const currentPauseKeyState = this.inputManager.isKeyPressed('p');
    if (currentPauseKeyState && !this.lastPauseKeyState) {
      this.togglePause();
    }
    this.lastPauseKeyState = currentPauseKeyState;
  }

  private handleGameInput(): void {
    // Handle upgrade menu toggle
    const currentUpgradeKeyState = this.inputManager.isKeyPressed('u');
    if (currentUpgradeKeyState && !this.lastUpgradeKeyState) {
      this.hud.toggleUpgradeMenu();
    }
    this.lastUpgradeKeyState = currentUpgradeKeyState;

    // Handle reduced motion toggle
    const currentMotionKeyState = this.inputManager.isKeyPressed('m');
    if (currentMotionKeyState && !this.lastMotionKeyState) {
      this.toggleReducedMotion();
    }
    this.lastMotionKeyState = currentMotionKeyState;

    // Handle mouse/touch clicks
    if (this.inputManager.wasMouseJustPressed()) {
      const mousePos = this.inputManager.getMousePosition();
      
      // Check mobile UI buttons first
      const mobileButtonPressed = this.mobileUI.handleTouch(mousePos);
      if (mobileButtonPressed) {
        this.handleMobileButtonPress(mobileButtonPressed);
        return; // Don't process other clicks
      }
      
      // Check if click was on upgrade menu
      if (this.hud.isUpgradeMenuOpen()) {
        const upgradeClicked = this.hud.handleClick(mousePos);
        if (!upgradeClicked) {
          // Click wasn't on an upgrade button, could close menu or ignore
        }
      } else {
        // Normal zombie spawning
        const success = this.zombieSystem.spawnZombie(mousePos);
        if (success) {
          this.accessibilityManager.announceMobileAction('zombie-spawned');
        } else {
          console.log('Cannot spawn more zombies - limit reached!');
          this.accessibilityManager.announceMobileAction('zombie-limit-reached');
        }
      }
    }
  }

  private render(_interpolationFactor: number): void {
    const canvasWidth = this.canvas.width / this.devicePixelRatio;
    const canvasHeight = this.canvas.height / this.devicePixelRatio;
    
    // Clear canvas with area-specific background color
    const currentArea = this.areaManager.getCurrentArea();
    this.ctx.fillStyle = currentArea.backgroundColor;
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Render area-specific background effects
    this.visualEffects.renderBackgroundEffects(this.ctx, currentArea);
    
    // Render walker system
    this.walkerSystem.render(this.ctx);
    
    // Render zombie system
    this.zombieSystem.render(this.ctx);
    
    // Render visual effects (particles, etc.)
    this.visualEffects.render(this.ctx);
    
    // Show pause overlay if paused
    if (this.isPaused) {
      this.ctx.save();
      
      // Semi-transparent overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Pause text
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      this.ctx.fillText('PAUSED', centerX, centerY);
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Press P to resume', centerX, centerY + 40);
      
      this.ctx.restore();
    }
    
    // Draw FPS counter (if enabled in settings)
    if (this.settingsManager.shouldShowFPS()) {
      this.drawFPS();
    }
    
    // Draw walker count and controls info
    this.drawUI();
    
    // Render HUD (souls counter, upgrade menu, etc.)
    this.hud.render(this.ctx);
    
    // Render mobile UI (touch buttons, etc.)
    this.mobileUI.render(this.ctx);
  }

  private drawFPS(): void {
    this.ctx.save();
    
    // Position FPS counter in top-left
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '14px Arial';
    
    // Color code FPS: Green >50, Yellow 30-50, Red <30
    if (this.fps >= 50) {
      this.ctx.fillStyle = '#00ff00';
    } else if (this.fps >= 30) {
      this.ctx.fillStyle = '#ffff00';
    } else {
      this.ctx.fillStyle = '#ff0000';
    }
    
    const metrics = this.performanceMonitor.getMetrics();
    const performanceLevel = this.performanceMonitor.getPerformanceLevel();
    
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 10);
    this.ctx.fillText(`Frame: ${metrics.frameTime.toFixed(1)}ms`, 10, 28);
    this.ctx.fillText(`Level: ${performanceLevel.toUpperCase()}`, 10, 46);
    this.ctx.fillText(`Entities: ${metrics.entityCount}`, 10, 64);
    this.ctx.fillText(`Particles: ${metrics.particleCount}`, 10, 82);
    
    this.ctx.restore();
  }

  private drawUI(): void {
    this.ctx.save();
    
    const canvasHeight = this.canvas.height / this.devicePixelRatio;
    const canvasWidth = this.canvas.width / this.devicePixelRatio;
    
    // Draw entity counts in top-right
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    
    const walkerCount = this.walkerSystem.getWalkerCount();
    const zombieCount = this.zombieSystem.getZombieCount();
    const maxZombies = this.zombieSystem.getMaxZombies();
    
    this.ctx.fillText(`Walkers: ${walkerCount}`, canvasWidth - 10, 10);
    this.ctx.fillText(`Zombies: ${zombieCount}/${maxZombies}`, canvasWidth - 10, 30);
    
    // Draw basic controls info in bottom-left
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#666';
    
    this.ctx.fillText('Press P to pause/resume', 10, canvasHeight - 50);
    this.ctx.fillText('Press M to toggle reduced motion', 10, canvasHeight - 30);
    this.ctx.fillText('Click/tap to spawn zombies', 10, canvasHeight - 10);
    
    this.ctx.restore();
  }

  // Handle performance level changes
  private handlePerformanceLevelChange(level: PerformanceLevel): void {
    switch (level) {
      case PerformanceLevel.LOW:
        console.log('Switching to low performance mode - reducing visual effects');
        // Additional low-performance optimizations could go here
        break;
      case PerformanceLevel.MEDIUM:
        console.log('Switching to medium performance mode - moderate optimizations');
        break;
      case PerformanceLevel.HIGH:
        console.log('Switching to high performance mode - full visual effects');
        break;
    }
  }

  // Load game state from save manager
  private loadGameState(): void {
    const saveData = this.saveManager.loadGameState();
    if (saveData) {
      // Load resource data
      this.resourceManager.setSouls(saveData.souls);
      this.resourceManager.setWalkersDefeated(saveData.walkersDefeated);
      
      // Load upgrade data
      if (saveData.upgrades) {
        this.upgradeManager.loadUpgradeData(saveData.upgrades);
      }
      
      // Load area progression
      this.areaManager.setCurrentArea(saveData.currentArea, saveData.walkersDefeated);
      
      console.log('Game state loaded successfully');
    } else {
      console.log('No save data found, starting fresh game');
    }
  }

  // Check for area progression and auto-advance if needed
  private checkAreaProgression(): void {
    const walkersDefeated = this.resourceManager.getWalkersDefeated();
    const areaChanged = this.areaManager.autoAdvanceArea(walkersDefeated);
    
    if (areaChanged) {
      const newArea = this.areaManager.getCurrentArea();
      console.log(`Advanced to new area: ${newArea.name}`);
      
      // Update walker sprites for the new area
      this.walkerSystem.updateWalkerSprites(this.areaManager.getCurrentAreaId());
      
      // Create area transition visual effect
      this.visualEffects.createAreaTransitionEffect(newArea);
      
      // Save the area progression
      this.saveManager.saveGameState({
        currentArea: this.areaManager.getCurrentAreaId()
      });
    }
  }

  // Initialize mobile-specific optimizations
  private initializeMobileOptimizations(): void {
    if (!this.mobileUI.isMobileDevice()) {
      return;
    }

    console.log('Initializing mobile optimizations...');

    // Optimize mobile UI for current device
    this.mobileUI.optimizeForDevice();

    // Validate accessibility compliance
    const accessibilityCheck = this.mobileUI.validateAccessibility();
    if (!accessibilityCheck.valid) {
      console.warn('Accessibility issues detected:', accessibilityCheck.issues);
    } else {
      console.log('Mobile accessibility validation passed');
    }

    // Set up mobile-specific event listeners
    this.setupMobileEventListeners();

    // Announce mobile interface availability
    const mobileInfo = this.mobileUI.getAccessibilityInfo();
    this.accessibilityManager.announce(
      `Mobile interface active. ${mobileInfo.join('. ')}`,
      'polite'
    );
  }

  private setupMobileEventListeners(): void {
    // Prevent zoom on double-tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Prevent context menu on long press
    document.addEventListener('contextmenu', (event) => {
      if (this.mobileUI.isMobileDevice()) {
        event.preventDefault();
      }
    });

    // Handle device orientation lock if supported
    if ('orientation' in screen && 'lock' in screen.orientation) {
      // Try to lock to landscape on mobile for better gameplay
      try {
        (screen.orientation as any).lock('landscape').catch(() => {
          console.log('Orientation lock not supported or denied');
        });
      } catch (error) {
        console.log('Orientation lock not available');
      }
    }

    // Handle wake lock to prevent screen from turning off during gameplay
    if ('wakeLock' in navigator) {
      let wakeLock: any = null;
      
      const requestWakeLock = async () => {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Screen wake lock activated');
        } catch (error) {
          console.log('Wake lock request failed:', error);
        }
      };

      // Request wake lock when game starts
      if (!this.isPaused) {
        requestWakeLock();
      }

      // Re-request wake lock when visibility changes
      document.addEventListener('visibilitychange', () => {
        if (wakeLock !== null && document.visibilityState === 'visible' && !this.isPaused) {
          requestWakeLock();
        }
      });
    }
  }

  // Cleanup method
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Clean up accessibility manager
    this.accessibilityManager.destroy();
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new Game();
    console.log('Endless Horde game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});