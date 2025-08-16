// HUD (Heads-Up Display) for showing game information and upgrade buttons
import { ResourceManager } from '../managers/ResourceManager.ts';
import { UpgradeManager } from '../managers/UpgradeManager.ts';
import { AreaManager } from '../managers/AreaManager.ts';
import { Vector2 } from '../core/Vector2.ts';

export interface UpgradeButton {
  id: string;
  label: string;
  cost: number;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enabled: boolean;
  level: number;
}

export class HUD {
  private resourceManager: ResourceManager;
  private upgradeManager: UpgradeManager;
  private areaManager: AreaManager;
  private canvasWidth: number;
  private canvasHeight: number;
  private upgradeButtons: UpgradeButton[] = [];
  private showUpgradeMenu: boolean = false;
  private onUpgradePurchased?: (upgradeId: string) => void;

  constructor(resourceManager: ResourceManager, upgradeManager: UpgradeManager, areaManager: AreaManager, canvasWidth: number, canvasHeight: number) {
    this.resourceManager = resourceManager;
    this.upgradeManager = upgradeManager;
    this.areaManager = areaManager;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initializeUpgradeButtons();
  }

  private initializeUpgradeButtons(): void {
    // Initialize upgrade buttons with data from upgrade manager
    this.upgradeButtons = [
      {
        id: 'zombie-speed',
        label: 'Zombie Speed',
        cost: this.upgradeManager.getUpgradeCost('zombie-speed'),
        description: 'Increase zombie movement speed (+20%)',
        x: 0, y: 0, width: 180, height: 50,
        enabled: false,
        level: this.upgradeManager.getUpgradeLevel('zombie-speed')
      },
      {
        id: 'max-zombies',
        label: 'Max Zombies',
        cost: this.upgradeManager.getUpgradeCost('max-zombies'),
        description: 'Increase maximum zombie count (+5)',
        x: 0, y: 0, width: 180, height: 50,
        enabled: false,
        level: this.upgradeManager.getUpgradeLevel('max-zombies')
      }
    ];
  }

  update(): void {
    // Update button positions, costs, levels, and enabled states
    const souls = this.resourceManager.getSouls();
    
    for (let i = 0; i < this.upgradeButtons.length; i++) {
      const button = this.upgradeButtons[i];
      
      // Update cost and level from upgrade manager
      button.cost = this.upgradeManager.getUpgradeCost(button.id);
      button.level = this.upgradeManager.getUpgradeLevel(button.id);
      button.enabled = souls >= button.cost;
      
      // Position buttons in upgrade menu area
      if (this.showUpgradeMenu) {
        button.x = this.canvasWidth / 2 - button.width / 2;
        button.y = this.canvasHeight / 2 - 100 + (i * 70);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderSoulsCounter(ctx);
    this.renderAreaInfo(ctx);
    this.renderControls(ctx);
    
    if (this.showUpgradeMenu) {
      this.renderUpgradeMenu(ctx);
    }
  }

  private renderSoulsCounter(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Position souls counter in top-left, below FPS
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFD700'; // Gold color for souls
    
    const souls = this.resourceManager.getSouls();
    const walkersDefeated = this.resourceManager.getWalkersDefeated();
    
    ctx.fillText(`Souls: ${souls}`, 10, 35);
    
    // Show walkers defeated count
    ctx.font = '14px Arial';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(`Walkers Defeated: ${walkersDefeated}`, 10, 60);
    
    ctx.restore();
  }

  private renderAreaInfo(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const currentArea = this.areaManager.getCurrentArea();
    const walkersDefeated = this.resourceManager.getWalkersDefeated();
    
    // Position area info in top-center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';
    
    const centerX = this.canvasWidth / 2;
    ctx.fillText(currentArea.name, centerX, 10);
    
    // Show area multiplier
    ctx.font = '12px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Soul Multiplier: x${currentArea.soulMultiplier}`, centerX, 30);
    
    // Show progress to next area
    const progress = this.areaManager.getProgressToNextArea(walkersDefeated);
    if (progress) {
      ctx.font = '11px Arial';
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(`Next Area: ${progress.current}/${progress.required} (${Math.floor(progress.percentage)}%)`, centerX, 45);
      
      // Progress bar
      const barWidth = 120;
      const barHeight = 4;
      const barX = centerX - barWidth / 2;
      const barY = 60;
      
      // Background
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Progress
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(barX, barY, barWidth * (progress.percentage / 100), barHeight);
    } else {
      // Max area reached
      ctx.font = '11px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('Maximum Area Reached!', centerX, 45);
    }
    
    ctx.restore();
  }

  private renderControls(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Add upgrade menu control info
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666';
    
    ctx.fillText('Press U to open upgrades', 10, this.canvasHeight - 50);
    
    ctx.restore();
  }

  private renderUpgradeMenu(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Draw upgrade menu title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UPGRADES', this.canvasWidth / 2, this.canvasHeight / 2 - 150);
    
    // Draw souls counter in menu
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Souls: ${this.resourceManager.getSouls()}`, this.canvasWidth / 2, this.canvasHeight / 2 - 120);
    
    // Draw upgrade buttons
    for (const button of this.upgradeButtons) {
      this.renderUpgradeButton(ctx, button);
    }
    
    // Draw close instruction
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '16px Arial';
    ctx.fillText('Press U to close', this.canvasWidth / 2, this.canvasHeight / 2 + 150);
    
    ctx.restore();
  }

  private renderUpgradeButton(ctx: CanvasRenderingContext2D, button: UpgradeButton): void {
    ctx.save();
    
    // Button background
    ctx.fillStyle = button.enabled ? '#4CAF50' : '#666666';
    ctx.fillRect(button.x, button.y, button.width, button.height);
    
    // Button border
    ctx.strokeStyle = button.enabled ? '#45a049' : '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    
    // Button text
    ctx.fillStyle = button.enabled ? '#FFFFFF' : '#AAAAAA';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    
    ctx.fillText(`${button.label} (Lv.${button.level})`, centerX, centerY - 12);
    
    // Description text
    ctx.font = '10px Arial';
    ctx.fillText(button.description, centerX, centerY);
    
    // Cost text
    ctx.font = '12px Arial';
    ctx.fillText(`Cost: ${button.cost} souls`, centerX, centerY + 12);
    
    ctx.restore();
  }

  // Handle input for upgrade menu
  toggleUpgradeMenu(): void {
    this.showUpgradeMenu = !this.showUpgradeMenu;
  }

  isUpgradeMenuOpen(): boolean {
    return this.showUpgradeMenu;
  }

  // Handle click on upgrade buttons
  handleClick(mousePos: Vector2): boolean {
    if (!this.showUpgradeMenu) return false;
    
    for (const button of this.upgradeButtons) {
      if (this.isPointInButton(mousePos, button) && button.enabled) {
        return this.purchaseUpgrade(button.id);
      }
    }
    
    return false;
  }

  private isPointInButton(point: Vector2, button: UpgradeButton): boolean {
    return point.x >= button.x && 
           point.x <= button.x + button.width &&
           point.y >= button.y && 
           point.y <= button.y + button.height;
  }

  private purchaseUpgrade(upgradeId: string): boolean {
    const button = this.upgradeButtons.find(b => b.id === upgradeId);
    if (!button || !button.enabled) return false;
    
    if (this.resourceManager.spendSouls(button.cost)) {
      // Purchase the upgrade through the upgrade manager
      this.upgradeManager.purchaseUpgrade(upgradeId);
      
      console.log(`Purchased upgrade: ${button.label} (Level ${button.level + 1})`);
      
      // Notify game systems about the upgrade
      if (this.onUpgradePurchased) {
        this.onUpgradePurchased(upgradeId);
      }
      
      return true;
    }
    
    return false;
  }

  // Update canvas dimensions when window resizes
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // Get upgrade button by ID (for external systems to check purchases)
  getUpgradeButton(id: string): UpgradeButton | undefined {
    return this.upgradeButtons.find(b => b.id === id);
  }

  // Set callback for when upgrades are purchased
  setOnUpgradePurchased(callback: (upgradeId: string) => void): void {
    this.onUpgradePurchased = callback;
  }
}