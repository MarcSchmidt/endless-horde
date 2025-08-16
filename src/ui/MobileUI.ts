// Mobile UI manager for touch-friendly controls and mobile-specific interface elements
import { Vector2 } from '../core/Vector2.ts';

export interface TouchButton {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  pressed: boolean;
  icon?: string;
  callback?: () => void;
}

export class MobileUI {
  private canvasWidth: number;
  private canvasHeight: number;
  private touchButtons: TouchButton[] = [];
  private isMobile: boolean = false;
  private touchScale: number = 1;
  private minTouchSize: number = 44; // Minimum touch target size (44px recommended)
  private lastTouchTime: number = 0;
  private touchCooldown: number = 150; // Prevent accidental double-taps
  private vibrationSupported: boolean = false;

  constructor(_canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.detectMobile();
    this.detectVibrationSupported();
    this.calculateTouchScale();
    this.initializeTouchButtons();
  }

  private detectMobile(): void {
    // Detect mobile devices using multiple methods
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0) ||
                   window.innerWidth <= 768; // Consider small screens as mobile
    
    console.log(`Mobile device detected: ${this.isMobile}`);
  }

  private detectVibrationSupported(): void {
    this.vibrationSupported = 'vibrate' in navigator;
    console.log(`Vibration support: ${this.vibrationSupported}`);
  }

  private calculateTouchScale(): void {
    // Calculate appropriate scaling for touch targets based on screen size
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDimension = Math.min(screenWidth, screenHeight);
    
    // Scale touch targets based on screen size, ensuring minimum 44px
    // Use device pixel ratio for high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.touchScale = Math.max(1, (minDimension / 400) * Math.min(devicePixelRatio, 2));
    
    console.log(`Touch scale calculated: ${this.touchScale} (DPR: ${devicePixelRatio})`);
  }

  private initializeTouchButtons(): void {
    if (!this.isMobile) return;

    const buttonSize = Math.max(this.minTouchSize, 50 * this.touchScale);
    const margin = 20 * this.touchScale;

    // Pause button (top-right corner)
    this.touchButtons.push({
      id: 'pause',
      label: '⏸️',
      x: this.canvasWidth - buttonSize - margin,
      y: margin,
      width: buttonSize,
      height: buttonSize,
      visible: true,
      pressed: false,
      icon: 'pause'
    });

    // Upgrade menu button (bottom-right corner)
    this.touchButtons.push({
      id: 'upgrades',
      label: '⬆️',
      x: this.canvasWidth - buttonSize - margin,
      y: this.canvasHeight - buttonSize - margin,
      width: buttonSize,
      height: buttonSize,
      visible: true,
      pressed: false,
      icon: 'upgrades'
    });

    // Settings button (bottom-left corner)
    this.touchButtons.push({
      id: 'settings',
      label: '⚙️',
      x: margin,
      y: this.canvasHeight - buttonSize - margin,
      width: buttonSize,
      height: buttonSize,
      visible: true,
      pressed: false,
      icon: 'settings'
    });
  }

  public updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.calculateTouchScale();
    this.repositionButtons();
  }

  private repositionButtons(): void {
    if (!this.isMobile) return;

    const buttonSize = Math.max(this.minTouchSize, 50 * this.touchScale);
    const margin = 20 * this.touchScale;

    // Update button positions
    for (const button of this.touchButtons) {
      switch (button.id) {
        case 'pause':
          button.x = this.canvasWidth - buttonSize - margin;
          button.y = margin;
          break;
        case 'upgrades':
          button.x = this.canvasWidth - buttonSize - margin;
          button.y = this.canvasHeight - buttonSize - margin;
          break;
        case 'settings':
          button.x = margin;
          button.y = this.canvasHeight - buttonSize - margin;
          break;
      }
      button.width = buttonSize;
      button.height = buttonSize;
    }
  }

  public handleTouch(touchPos: Vector2): string | null {
    if (!this.isMobile) return null;

    // Prevent rapid successive touches
    const currentTime = Date.now();
    if (currentTime - this.lastTouchTime < this.touchCooldown) {
      return null;
    }

    for (const button of this.touchButtons) {
      if (button.visible && this.isPointInButton(touchPos, button)) {
        button.pressed = true;
        this.lastTouchTime = currentTime;
        
        // Provide haptic feedback if supported
        this.provideHapticFeedback();
        
        // Add visual feedback with timeout
        setTimeout(() => {
          button.pressed = false;
        }, 150);
        
        return button.id;
      }
    }

    return null;
  }

  private provideHapticFeedback(): void {
    if (this.vibrationSupported) {
      try {
        navigator.vibrate(50); // Short vibration for button press
      } catch (error) {
        console.log('Vibration failed:', error);
      }
    }
  }

  private isPointInButton(point: Vector2, button: TouchButton): boolean {
    return point.x >= button.x && 
           point.x <= button.x + button.width &&
           point.y >= button.y && 
           point.y <= button.y + button.height;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isMobile) return;

    ctx.save();

    for (const button of this.touchButtons) {
      if (button.visible) {
        this.renderTouchButton(ctx, button);
      }
    }

    ctx.restore();
  }

  private renderTouchButton(ctx: CanvasRenderingContext2D, button: TouchButton): void {
    // Add rounded corners for modern look
    const cornerRadius = Math.min(button.width, button.height) * 0.15;
    
    // Button shadow (render first, behind button)
    if (!button.pressed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.fillRoundedRect(ctx, button.x + 3, button.y + 3, button.width, button.height, cornerRadius);
    }

    // Button background with transparency
    ctx.fillStyle = button.pressed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    this.fillRoundedRect(ctx, button.x, button.y, button.width, button.height, cornerRadius);

    // Button border with rounded corners
    ctx.strokeStyle = button.pressed ? '#ffffff' : '#cccccc';
    ctx.lineWidth = Math.max(2, this.touchScale);
    this.strokeRoundedRect(ctx, button.x, button.y, button.width, button.height, cornerRadius);

    // Button icon/label with better scaling
    ctx.fillStyle = button.pressed ? '#000000' : '#ffffff';
    const fontSize = Math.floor(button.height * 0.35 * this.touchScale);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    
    ctx.fillText(button.label, centerX, centerY);

    // Add accessibility indicator for screen readers
    if (button.pressed) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'; // Green highlight
      this.fillRoundedRect(ctx, button.x, button.y, button.width, button.height, cornerRadius);
    }
  }

  private fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  private strokeRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  }

  public isMobileDevice(): boolean {
    return this.isMobile;
  }

  public getTouchScale(): number {
    return this.touchScale;
  }

  public setButtonVisibility(buttonId: string, visible: boolean): void {
    const button = this.touchButtons.find(b => b.id === buttonId);
    if (button) {
      button.visible = visible;
    }
  }

  public setButtonCallback(buttonId: string, callback: () => void): void {
    const button = this.touchButtons.find(b => b.id === buttonId);
    if (button) {
      button.callback = callback;
    }
  }

  // Get recommended UI scaling for mobile
  public getUIScale(): number {
    if (!this.isMobile) return 1;
    
    // Scale UI elements based on screen density and size
    const baseScale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
    return Math.max(0.8, Math.min(1.5, baseScale));
  }

  // Check if touch targets are appropriately sized
  public validateTouchTargets(): boolean {
    if (!this.isMobile) return true;

    for (const button of this.touchButtons) {
      if (button.visible && (button.width < this.minTouchSize || button.height < this.minTouchSize)) {
        console.warn(`Touch target ${button.id} is too small: ${button.width}x${button.height}`);
        return false;
      }
    }

    return true;
  }

  // Get accessibility information for screen readers
  public getAccessibilityInfo(): string[] {
    const info: string[] = [];
    
    if (this.isMobile) {
      info.push('Mobile interface active');
      info.push(`Touch scale: ${this.touchScale.toFixed(1)}`);
      info.push(`Vibration support: ${this.vibrationSupported ? 'enabled' : 'disabled'}`);
      
      for (const button of this.touchButtons) {
        if (button.visible) {
          info.push(`${button.id} button available at position ${Math.round(button.x)}, ${Math.round(button.y)}`);
        }
      }
    }

    return info;
  }

  // Enhanced touch target validation for accessibility compliance
  public validateAccessibility(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    let valid = true;

    if (!this.isMobile) {
      return { valid: true, issues: [] };
    }

    // Check minimum touch target sizes (WCAG 2.1 AA compliance)
    for (const button of this.touchButtons) {
      if (button.visible) {
        if (button.width < this.minTouchSize || button.height < this.minTouchSize) {
          issues.push(`Button ${button.id} is too small: ${button.width}x${button.height}px (minimum: ${this.minTouchSize}px)`);
          valid = false;
        }

        // Check spacing between buttons (minimum 8px recommended)
        for (const otherButton of this.touchButtons) {
          if (otherButton !== button && otherButton.visible) {
            const distance = this.getButtonDistance(button, otherButton);
            if (distance < 8) {
              issues.push(`Buttons ${button.id} and ${otherButton.id} are too close: ${distance.toFixed(1)}px`);
              valid = false;
            }
          }
        }
      }
    }

    // Check if buttons are within safe areas (avoiding notches, etc.)
    const safeAreaTop = this.getSafeAreaInset('top');
    const safeAreaBottom = this.getSafeAreaInset('bottom');
    
    for (const button of this.touchButtons) {
      if (button.visible) {
        if (button.y < safeAreaTop) {
          issues.push(`Button ${button.id} may be obscured by device notch or status bar`);
        }
        if (button.y + button.height > this.canvasHeight - safeAreaBottom) {
          issues.push(`Button ${button.id} may be obscured by device home indicator`);
        }
      }
    }

    return { valid, issues };
  }

  private getButtonDistance(button1: TouchButton, button2: TouchButton): number {
    const centerX1 = button1.x + button1.width / 2;
    const centerY1 = button1.y + button1.height / 2;
    const centerX2 = button2.x + button2.width / 2;
    const centerY2 = button2.y + button2.height / 2;
    
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  }

  private getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
    // Try to get CSS safe area insets if available
    const style = getComputedStyle(document.documentElement);
    const safeAreaValue = style.getPropertyValue(`env(safe-area-inset-${side})`);
    
    if (safeAreaValue) {
      return parseInt(safeAreaValue) || 0;
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

  // Optimize touch response for different device types
  public optimizeForDevice(): void {
    if (!this.isMobile) return;

    const userAgent = navigator.userAgent;
    
    // iOS-specific optimizations
    if (/iPhone|iPad/.test(userAgent)) {
      this.touchCooldown = 100; // iOS has good touch handling
      console.log('Applied iOS touch optimizations');
    }
    
    // Android-specific optimizations
    else if (/Android/.test(userAgent)) {
      this.touchCooldown = 200; // Android may need more debouncing
      console.log('Applied Android touch optimizations');
    }
    
    // Adjust for high refresh rate displays
    if (window.screen && (window.screen as any).refreshRate > 60) {
      this.touchCooldown = Math.max(50, this.touchCooldown * 0.8);
      console.log('Optimized for high refresh rate display');
    }
  }

  // Get recommended touch area expansion for better usability
  public getTouchAreaExpansion(): number {
    // Expand touch areas beyond visual boundaries for easier tapping
    return Math.max(8, this.touchScale * 6);
  }

  // Check if a point is within the expanded touch area of a button
  public isPointInExpandedTouchArea(point: Vector2, button: TouchButton): boolean {
    const expansion = this.getTouchAreaExpansion();
    return point.x >= button.x - expansion && 
           point.x <= button.x + button.width + expansion &&
           point.y >= button.y - expansion && 
           point.y <= button.y + button.height + expansion;
  }
}