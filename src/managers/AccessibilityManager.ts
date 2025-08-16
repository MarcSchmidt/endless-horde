// Accessibility manager for screen reader support and other accessibility features
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcementElement: HTMLElement | null = null;
  private lastAnnouncement: string = '';
  private announcementTimeout: number | null = null;

  private constructor() {
    this.initializeAnnouncementElement();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private initializeAnnouncementElement(): void {
    this.announcementElement = document.getElementById('sr-announcements');
    if (!this.announcementElement) {
      // Create the element if it doesn't exist
      this.announcementElement = document.createElement('div');
      this.announcementElement.id = 'sr-announcements';
      this.announcementElement.setAttribute('aria-live', 'polite');
      this.announcementElement.setAttribute('aria-atomic', 'true');
      this.announcementElement.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(this.announcementElement);
    }
  }

  // Announce text to screen readers
  public announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcementElement || !text.trim()) return;

    // Avoid duplicate announcements
    if (text === this.lastAnnouncement) return;
    this.lastAnnouncement = text;

    // Clear any existing timeout
    if (this.announcementTimeout) {
      clearTimeout(this.announcementTimeout);
    }

    // Set the priority
    this.announcementElement.setAttribute('aria-live', priority);

    // Clear and set the text
    this.announcementElement.textContent = '';
    
    // Use a small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (this.announcementElement) {
        this.announcementElement.textContent = text;
      }
    }, 100);

    // Clear the announcement after a delay to prevent it from being read again
    this.announcementTimeout = window.setTimeout(() => {
      if (this.announcementElement) {
        this.announcementElement.textContent = '';
      }
      this.lastAnnouncement = '';
    }, 5000);
  }

  // Announce game state changes
  public announceGameState(state: string): void {
    switch (state) {
      case 'paused':
        this.announce('Game paused', 'assertive');
        break;
      case 'resumed':
        this.announce('Game resumed', 'assertive');
        break;
      case 'upgrade-menu-opened':
        this.announce('Upgrade menu opened', 'polite');
        break;
      case 'upgrade-menu-closed':
        this.announce('Upgrade menu closed', 'polite');
        break;
      default:
        this.announce(state, 'polite');
    }
  }

  // Announce upgrade purchases
  public announceUpgrade(upgradeName: string, level: number, cost: number): void {
    this.announce(`Purchased ${upgradeName} level ${level} for ${cost} souls`, 'polite');
  }

  // Announce area progression
  public announceAreaChange(areaName: string, areaLevel: number): void {
    this.announce(`Advanced to ${areaName}, area ${areaLevel}`, 'polite');
  }

  // Announce resource changes (throttled to avoid spam)
  private lastResourceAnnouncement: number = 0;
  public announceResourceChange(souls: number, walkersDefeated: number): void {
    const now = Date.now();
    if (now - this.lastResourceAnnouncement < 2000) return; // Throttle to every 2 seconds
    
    this.lastResourceAnnouncement = now;
    this.announce(`${souls} souls, ${walkersDefeated} walkers defeated`, 'polite');
  }

  // Announce mobile UI interactions
  public announceMobileAction(action: string): void {
    switch (action) {
      case 'zombie-spawned':
        this.announce('Zombie spawned', 'polite');
        break;
      case 'zombie-limit-reached':
        this.announce('Maximum zombies reached', 'polite');
        break;
      case 'touch-button-pressed':
        this.announce('Button pressed', 'polite');
        break;
      default:
        this.announce(action, 'polite');
    }
  }

  // Get current accessibility status
  public getAccessibilityStatus(): { [key: string]: boolean } {
    return {
      screenReaderSupport: !!this.announcementElement,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  }

  // Set focus on canvas for keyboard navigation
  public focusCanvas(): void {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.focus();
    }
  }

  // Handle keyboard navigation
  public handleKeyboardNavigation(event: KeyboardEvent): boolean {
    // Handle common accessibility keyboard shortcuts
    switch (event.key) {
      case 'Escape':
        // Close any open menus
        this.announce('Menu closed', 'polite');
        return true;
      case 'Tab':
        // Allow default tab behavior
        return false;
      case 'Enter':
      case ' ':
        // Treat as click/tap
        this.announce('Action triggered', 'polite');
        return true;
      default:
        return false;
    }
  }

  // Provide game instructions for screen readers
  public announceGameInstructions(): void {
    const instructions = [
      'Welcome to Endless Horde.',
      'Tap or click on the screen to spawn zombies.',
      'Zombies will hunt walkers and earn you souls.',
      'Use souls to purchase upgrades.',
      'On mobile, use the touch buttons for controls.',
      'Press P to pause, U for upgrades, M for reduced motion.'
    ].join(' ');
    
    this.announce(instructions, 'polite');
  }

  // Clean up resources
  public destroy(): void {
    if (this.announcementTimeout) {
      clearTimeout(this.announcementTimeout);
    }
  }
}