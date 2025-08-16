// HUD (Heads-Up Display) for showing game information and upgrade buttons
import { ResourceManager } from '../managers/ResourceManager.ts';
import { UpgradeManager } from '../managers/UpgradeManager.ts';
import { AreaManager } from '../managers/AreaManager.ts';
import { AccessibilityManager } from '../managers/AccessibilityManager.ts';
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
  private isMobile: boolean = false;
  private uiScale: number = 1;
  private accessibilityManager: AccessibilityManager;

  constructor(resourceManager: ResourceManager, upgradeManager: UpgradeManager, areaManager: AreaManager, canvasWidth: number, canvasHeight: number) {
    this.resourceManager = resourceManager;
    this.upgradeManager = upgradeManager;
    this.areaManager = areaManager;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.accessibilityManager = AccessibilityManager.getInstance();
    this.detectMobile();
    this.calculateUIScale();
    this.initializeUpgradeButtons();
  }

  private detectMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0) ||
                   window.innerWidth <= 768;
  }

  private calculateUIScale(): void {
    if (this.isMobile) {
      // Scale UI based on screen size for mobile
      const baseScale = Math.min(this.canvasWidth / 800, this.canvasHeight / 600);
      this.uiScale = Math.max(0.8, Math.min(1.5, baseScale));
    } else {
      this.uiScale = 1;
    }
  }

  private initializeUpgradeButtons(): void {
    // Scale button size for mobile
    const buttonWidth = this.isMobile ? Math.max(200, 250 * this.uiScale) : 180;
    const buttonHeight = this.isMobile ? Math.max(60, 70 * this.uiScale) : 50;
    
    // Initialize upgrade buttons with data from upgrade manager
    this.upgradeButtons = [
      {
        id: 'zombie-speed',
        label: 'Zombie Speed',
        cost: this.upgradeManager.getUpgradeCost('zombie-speed'),
        description: 'Increase zombie movement speed (+20%)',
        x: 0, y: 0, width: buttonWidth, height: buttonHeight,
        enabled: false,
        level: this.upgradeManager.getUpgradeLevel('zombie-speed')
      },
      {
        id: 'max-zombies',
        label: 'Max Zombies',
        cost: this.upgradeManager.getUpgradeCost('max-zombies'),
        description: 'Increase maximum zombie count (+5)',
        x: 0, y: 0, width: buttonWidth, height: buttonHeight,
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
        const buttonSpacing = this.isMobile ? button.height + 20 : 70;
        button.y = this.canvasHeight / 2 - 100 + (i * buttonSpacing);
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
    
    // Scale fonts for mobile
    const mainFontSize = this.isMobile ? Math.max(16, 18 * this.uiScale) : 18;
    const subFontSize = this.isMobile ? Math.max(12, 14 * this.uiScale) : 14;
    
    // Position souls counter in top-left, below FPS
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${mainFontSize}px Arial`;
    ctx.fillStyle = '#FFD700'; // Gold color for souls
    
    const souls = this.resourceManager.getSouls();
    const walkersDefeated = this.resourceManager.getWalkersDefeated();
    
    const yOffset = this.isMobile ? 40 : 35;
    ctx.fillText(`Souls: ${souls}`, 10, yOffset);
    
    // Show walkers defeated count
    ctx.font = `${subFontSize}px Arial`;
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(`Walkers Defeated: ${walkersDefeated}`, 10, yOffset + 25);
    
    ctx.restore();
  }

  private renderAreaInfo(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    const currentArea = this.areaManager.getCurrentArea();
    const walkersDefeated = this.resourceManager.getWalkersDefeated();
    
    // Scale fonts for mobile
    const titleFontSize = this.isMobile ? Math.max(14, 16 * this.uiScale) : 16;
    const subFontSize = this.isMobile ? Math.max(10, 12 * this.uiScale) : 12;
    const smallFontSize = this.isMobile ? Math.max(9, 11 * this.uiScale) : 11;
    
    // Position area info in top-center, but avoid mobile UI buttons
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    
    const centerX = this.canvasWidth / 2;
    const startY = this.isMobile ? 15 : 10;
    
    ctx.fillText(currentArea.name, centerX, startY);
    
    // Show area multiplier
    ctx.font = `${subFontSize}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Soul Multiplier: x${currentArea.soulMultiplier}`, centerX, startY + 20);
    
    // Show progress to next area
    const progress = this.areaManager.getProgressToNextArea(walkersDefeated);
    if (progress) {
      ctx.font = `${smallFontSize}px Arial`;
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(`Next Area: ${progress.current}/${progress.required} (${Math.floor(progress.percentage)}%)`, centerX, startY + 35);
      
      // Progress bar - scale for mobile
      const barWidth = this.isMobile ? Math.min(150, this.canvasWidth * 0.4) : 120;
      const barHeight = this.isMobile ? 6 : 4;
      const barX = centerX - barWidth / 2;
      const barY = startY + 50;
      
      // Background
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Progress
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(barX, barY, barWidth * (progress.percentage / 100), barHeight);
    } else {
      // Max area reached
      ctx.font = `${smallFontSize}px Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText('Maximum Area Reached!', centerX, startY + 35);
    }
    
    ctx.restore();
  }

  private renderControls(ctx: CanvasRenderingContext2D): void {
    if (this.isMobile) {
      // Don't show keyboard controls on mobile - use touch buttons instead
      return;
    }
    
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
    
    // Scale fonts for mobile
    const titleFontSize = this.isMobile ? Math.max(20, 24 * this.uiScale) : 24;
    const soulsFontSize = this.isMobile ? Math.max(16, 18 * this.uiScale) : 18;
    const closeFontSize = this.isMobile ? Math.max(14, 16 * this.uiScale) : 16;
    
    // Draw upgrade menu title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UPGRADES', this.canvasWidth / 2, this.canvasHeight / 2 - 150);
    
    // Draw souls counter in menu
    ctx.font = `${soulsFontSize}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Souls: ${this.resourceManager.getSouls()}`, this.canvasWidth / 2, this.canvasHeight / 2 - 120);
    
    // Draw upgrade buttons
    for (const button of this.upgradeButtons) {
      this.renderUpgradeButton(ctx, button);
    }
    
    // Draw close instruction
    ctx.fillStyle = '#CCCCCC';
    ctx.font = `${closeFontSize}px Arial`;
    const closeText = this.isMobile ? 'Tap upgrade button to close' : 'Press U to close';
    ctx.fillText(closeText, this.canvasWidth / 2, this.canvasHeight / 2 + 150);
    
    ctx.restore();
  }

  private renderUpgradeButton(ctx: CanvasRenderingContext2D, button: UpgradeButton): void {
    ctx.save();
    
    // Button background
    ctx.fillStyle = button.enabled ? '#4CAF50' : '#666666';
    ctx.fillRect(button.x, button.y, button.width, button.height);
    
    // Button border - thicker for mobile
    ctx.strokeStyle = button.enabled ? '#45a049' : '#555555';
    ctx.lineWidth = this.isMobile ? 3 : 2;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    
    // Scale fonts for mobile
    const labelFontSize = this.isMobile ? Math.max(12, 14 * this.uiScale) : 14;
    const descFontSize = this.isMobile ? Math.max(9, 10 * this.uiScale) : 10;
    const costFontSize = this.isMobile ? Math.max(10, 12 * this.uiScale) : 12;
    
    // Button text
    ctx.fillStyle = button.enabled ? '#FFFFFF' : '#AAAAAA';
    ctx.font = `bold ${labelFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    
    const textSpacing = this.isMobile ? 15 : 12;
    
    ctx.fillText(`${button.label} (Lv.${button.level})`, centerX, centerY - textSpacing);
    
    // Description text
    ctx.font = `${descFontSize}px Arial`;
    ctx.fillText(button.description, centerX, centerY);
    
    // Cost text
    ctx.font = `${costFontSize}px Arial`;
    ctx.fillText(`Cost: ${button.cost} souls`, centerX, centerY + textSpacing);
    
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
      
      // Announce upgrade purchase for accessibility
      this.accessibilityManager.announceUpgrade(button.label, button.level + 1, button.cost);
      
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
    this.detectMobile();
    this.calculateUIScale();
    this.initializeUpgradeButtons(); // Reinitialize with new scaling
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