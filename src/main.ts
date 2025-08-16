// Main entry point for Endless Horde game
import { WalkerSystem } from './systems/WalkerSystem.ts';
import { ZombieSystem } from './systems/ZombieSystem.ts';
import { InputManager } from './systems/InputManager.ts';
import { ResourceManager } from './managers/ResourceManager.ts';
import { UpgradeManager } from './managers/UpgradeManager.ts';
import { AreaManager } from './managers/AreaManager.ts';
import { SaveManager } from './managers/SaveManager.ts';
import { HUD } from './ui/HUD.ts';

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
  private hud!: HUD;

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
    this.initializeSystems();
    this.startGameLoop();
  }

  private setupCanvas(): void {
    // Get viewport dimensions
    const viewportWidth = Math.min(window.innerWidth - 40, 800);
    const viewportHeight = Math.min(window.innerHeight - 120, 600);
    
    // Set canvas CSS size
    this.canvas.style.width = viewportWidth + 'px';
    this.canvas.style.height = viewportHeight + 'px';
    
    // Set actual size in memory (scaled for device pixel ratio)
    this.canvas.width = viewportWidth * this.devicePixelRatio;
    this.canvas.height = viewportHeight * this.devicePixelRatio;
    
    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  private setupInput(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.setupCanvas();
      // Update systems with new canvas dimensions
      if (this.walkerSystem && this.zombieSystem && this.hud) {
        const canvasWidth = this.canvas.width / this.devicePixelRatio;
        const canvasHeight = this.canvas.height / this.devicePixelRatio;
        this.walkerSystem.updateCanvasDimensions(canvasWidth, canvasHeight);
        this.zombieSystem.updateCanvasDimensions(canvasWidth, canvasHeight);
        this.hud.updateCanvasDimensions(canvasWidth, canvasHeight);
      }
    });
  }

  private initializeSystems(): void {
    const canvasWidth = this.canvas.width / this.devicePixelRatio;
    const canvasHeight = this.canvas.height / this.devicePixelRatio;
    
    // Initialize managers first
    this.saveManager = new SaveManager();
    this.resourceManager = new ResourceManager(this.saveManager);
    this.upgradeManager = new UpgradeManager(this.saveManager);
    this.areaManager = new AreaManager();
    
    // Initialize game systems
    this.walkerSystem = new WalkerSystem(canvasWidth, canvasHeight, this.areaManager);
    this.zombieSystem = new ZombieSystem(canvasWidth, canvasHeight, this.resourceManager, this.upgradeManager, this.areaManager);
    this.inputManager = new InputManager(this.canvas);
    this.hud = new HUD(this.resourceManager, this.upgradeManager, this.areaManager, canvasWidth, canvasHeight);
    
    // Set up upgrade callback
    this.hud.setOnUpgradePurchased((upgradeId: string) => {
      this.handleUpgradePurchased(upgradeId);
    });

    // Load game state and sync managers
    this.loadGameState();
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? 'Game Paused' : 'Game Resumed');
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
  }

  private update(deltaTime: number): void {
    // Update input manager
    this.inputManager.update();
    
    // Handle input
    this.handleInput();
    
    // Check for area progression
    this.checkAreaProgression();
    
    // Update walker system
    this.walkerSystem.update(deltaTime);
    
    // Update zombie system with walker data for AI targeting
    const activeWalkers = this.walkerSystem.getActiveWalkers();
    this.zombieSystem.update(deltaTime, activeWalkers);
    
    // Update HUD
    this.hud.update();
  }

  private handleInput(): void {
    // Handle pause toggle (only on key press, not hold)
    const currentPauseKeyState = this.inputManager.isKeyPressed('p');
    if (currentPauseKeyState && !this.lastPauseKeyState) {
      this.togglePause();
    }
    this.lastPauseKeyState = currentPauseKeyState;

    // Handle upgrade menu toggle
    const currentUpgradeKeyState = this.inputManager.isKeyPressed('u');
    if (currentUpgradeKeyState && !this.lastUpgradeKeyState) {
      this.hud.toggleUpgradeMenu();
    }
    this.lastUpgradeKeyState = currentUpgradeKeyState;

    // Handle mouse/touch clicks
    if (this.inputManager.wasMouseJustPressed()) {
      const mousePos = this.inputManager.getMousePosition();
      
      // Check if click was on upgrade menu first
      if (this.hud.isUpgradeMenuOpen()) {
        const upgradeClicked = this.hud.handleClick(mousePos);
        if (!upgradeClicked) {
          // Click wasn't on an upgrade button, could close menu or ignore
        }
      } else {
        // Normal zombie spawning
        const success = this.zombieSystem.spawnZombie(mousePos);
        if (!success) {
          console.log('Cannot spawn more zombies - limit reached!');
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
    
    // Render walker system
    this.walkerSystem.render(this.ctx);
    
    // Render zombie system
    this.zombieSystem.render(this.ctx);
    
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
    
    // Draw FPS counter
    this.drawFPS();
    
    // Draw walker count and controls info
    this.drawUI();
    
    // Render HUD (souls counter, upgrade menu, etc.)
    this.hud.render(this.ctx);
  }

  private drawFPS(): void {
    this.ctx.save();
    
    // Position FPS counter in top-left
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '16px Arial';
    
    // Color code FPS: Green >50, Yellow 30-50, Red <30
    if (this.fps >= 50) {
      this.ctx.fillStyle = '#00ff00';
    } else if (this.fps >= 30) {
      this.ctx.fillStyle = '#ffff00';
    } else {
      this.ctx.fillStyle = '#ff0000';
    }
    
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 10);
    
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
    
    this.ctx.fillText('Press P to pause/resume', 10, canvasHeight - 30);
    this.ctx.fillText('Click/tap to spawn zombies', 10, canvasHeight - 10);
    
    this.ctx.restore();
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
      
      // Save the area progression
      this.saveManager.saveGameState({
        currentArea: this.areaManager.getCurrentAreaId()
      });
    }
  }

  // Cleanup method
  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
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