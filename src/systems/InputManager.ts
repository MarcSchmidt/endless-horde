// Input manager for mouse/touch events and keyboard handling
import { Vector2 } from '../core/Vector2.ts';

export class InputManager {
  private keys: Set<string> = new Set();
  private mousePosition: Vector2 = new Vector2(0, 0);
  private mousePressed: boolean = false;
  private mouseJustPressed: boolean = false;
  private canvas: HTMLCanvasElement;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
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

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.handlePointerDown(touch.clientX, touch.clientY);
      }
    });

    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.mousePressed = false;
    });

    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.updateMousePosition(touch.clientX, touch.clientY);
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