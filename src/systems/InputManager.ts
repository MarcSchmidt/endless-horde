// Input manager for mouse/touch events and keyboard handling
import { Vector2 } from '../core/Vector2.ts';

export class InputManager {
  private keys: Set<string> = new Set();
  private mousePosition: Vector2 = new Vector2(0, 0);
  private mousePressed: boolean = false;
  private mouseJustPressed: boolean = false;
  private canvas: HTMLCanvasElement;
  private isTouchDevice: boolean = false;
  private touchStartTime: number = 0;
  private lastTouchEnd: number = 0;
  private touchMoved: boolean = false;
  private touchStartPosition: Vector2 = new Vector2(0, 0);
  private touchMoveThreshold: number = 10; // Pixels before considering it a move
  private multiTouchPrevented: boolean = false;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.detectTouchDevice();
    this.setupEventListeners();
  }

  private detectTouchDevice(): void {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    console.log(`Touch device detected: ${this.isTouchDevice}`);
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (event) => {
      this.keys.add(event.key.toLowerCase());
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    // Mouse events
    this.canvas.addEventListener('mousedown', (event) => {
      this.handlePointerDown(event.clientX, event.clientY);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mousePressed = false;
    });

    this.canvas.addEventListener('mousemove', (event) => {
      this.updateMousePosition(event.clientX, event.clientY);
    });

    // Enhanced touch events for mobile support
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      
      // Prevent multi-touch gestures that could interfere with gameplay
      if (event.touches.length > 1) {
        this.multiTouchPrevented = true;
        return;
      }
      
      this.multiTouchPrevented = false;
      
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.touchStartTime = Date.now();
        this.touchMoved = false;
        this.touchStartPosition.set(touch.clientX, touch.clientY);
        this.handlePointerDown(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      
      if (this.multiTouchPrevented) {
        this.multiTouchPrevented = false;
        return;
      }
      
      const touchEndTime = Date.now();
      
      // Prevent double-tap zoom on mobile
      if (touchEndTime - this.lastTouchEnd < 300) {
        event.preventDefault();
      }
      this.lastTouchEnd = touchEndTime;
      
      // Only register as click if touch didn't move much and was quick
      const touchDuration = touchEndTime - this.touchStartTime;
      if (!this.touchMoved && touchDuration < 500) {
        // This was a tap, not a drag - the click is already registered in touchstart
      }
      
      this.mousePressed = false;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      
      if (this.multiTouchPrevented || event.touches.length === 0) {
        return;
      }
      
      const touch = event.touches[0];
      
      // Calculate distance moved from start position
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - this.touchStartPosition.x, 2) + 
        Math.pow(touch.clientY - this.touchStartPosition.y, 2)
      );
      
      // Only consider it moved if beyond threshold
      if (moveDistance > this.touchMoveThreshold) {
        this.touchMoved = true;
      }
      
      this.updateMousePosition(touch.clientX, touch.clientY);
    }, { passive: false });

    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (event) => {
      if (this.isTouchDevice) {
        event.preventDefault();
      }
    });
  }

  private handlePointerDown(clientX: number, clientY: number): void {
    this.updateMousePosition(clientX, clientY);
    this.mousePressed = true;
    this.mouseJustPressed = true;
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    this.mousePosition.set(x, y);
  }

  // Check if a key is currently pressed
  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  // Get current mouse position in canvas coordinates
  getMousePosition(): Vector2 {
    return this.mousePosition.clone();
  }

  // Check if mouse/touch is currently pressed
  isMousePressed(): boolean {
    return this.mousePressed;
  }

  // Check if mouse/touch was just pressed this frame (consume the event)
  wasMouseJustPressed(): boolean {
    const result = this.mouseJustPressed;
    this.mouseJustPressed = false;
    return result;
  }

  // Check if this is a touch device
  isTouch(): boolean {
    return this.isTouchDevice;
  }

  // Get touch-friendly position with larger hit area
  getTouchPosition(): Vector2 {
    return this.mousePosition.clone();
  }

  // Update method to be called each frame
  update(): void {
    // Reset frame-specific states
    // mouseJustPressed is reset in wasMouseJustPressed()
  }

  // Cleanup method
  destroy(): void {
    // Remove event listeners if needed
    // For now, we'll keep them as they're on window/canvas
  }
}