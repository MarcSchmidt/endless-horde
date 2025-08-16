// Asset manager for loading and managing game sprites and animations
export interface SpriteData {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  framesPerRow: number;
}

export interface AnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AssetManager {
  private static instance: AssetManager;
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private spriteData: Map<string, SpriteData> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // Load an image and return a promise
  public async loadImage(path: string): Promise<HTMLImageElement> {
    // Check if already loaded
    if (this.loadedImages.has(path)) {
      return this.loadedImages.get(path)!;
    }

    // Check if currently loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Start loading
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(path);
        reject(new Error(`Failed to load image: ${path}`));
      };
      
      img.src = path;
    });

    this.loadingPromises.set(path, loadPromise);
    return loadPromise;
  }

  // Register sprite data for animations
  public registerSprite(
    name: string, 
    imagePath: string, 
    frameWidth: number, 
    frameHeight: number, 
    frameCount: number, 
    framesPerRow: number = frameCount
  ): Promise<void> {
    return this.loadImage(imagePath).then(image => {
      this.spriteData.set(name, {
        image,
        frameWidth,
        frameHeight,
        frameCount,
        framesPerRow
      });
    });
  }

  // Get sprite data
  public getSprite(name: string): SpriteData | null {
    return this.spriteData.get(name) || null;
  }

  // Get loaded image
  public getImage(path: string): HTMLImageElement | null {
    return this.loadedImages.get(path) || null;
  }

  // Check if sprite is loaded
  public isSpriteLoaded(name: string): boolean {
    return this.spriteData.has(name);
  }

  // Calculate animation frame coordinates
  public getAnimationFrame(spriteName: string, frameIndex: number): AnimationFrame | null {
    const sprite = this.getSprite(spriteName);
    if (!sprite) return null;

    const row = Math.floor(frameIndex / sprite.framesPerRow);
    const col = frameIndex % sprite.framesPerRow;

    return {
      x: col * sprite.frameWidth,
      y: row * sprite.frameHeight,
      width: sprite.frameWidth,
      height: sprite.frameHeight
    };
  }

  // Create placeholder sprites programmatically
  public createPlaceholderSprite(
    name: string, 
    frameWidth: number, 
    frameHeight: number, 
    frameCount: number,
    colors: string[]
  ): void {
    const canvas = document.createElement('canvas');
    const framesPerRow = Math.min(frameCount, 4); // Max 4 frames per row
    const rows = Math.ceil(frameCount / framesPerRow);
    
    canvas.width = framesPerRow * frameWidth;
    canvas.height = rows * frameHeight;
    
    const ctx = canvas.getContext('2d')!;
    
    // Create frames with different colors/patterns
    for (let i = 0; i < frameCount; i++) {
      const row = Math.floor(i / framesPerRow);
      const col = i % framesPerRow;
      const x = col * frameWidth;
      const y = row * frameHeight;
      
      // Use different colors for each frame to simulate animation
      const colorIndex = i % colors.length;
      ctx.fillStyle = colors[colorIndex];
      ctx.fillRect(x, y, frameWidth, frameHeight);
      
      // Add a border for visibility
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, frameWidth, frameHeight);
      
      // Add frame number for debugging
      ctx.fillStyle = '#fff';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((i + 1).toString(), x + frameWidth / 2, y + frameHeight / 2);
    }
    
    // Convert canvas to image and store
    const img = new Image();
    img.src = canvas.toDataURL();
    
    this.loadedImages.set(`placeholder_${name}`, img);
    this.spriteData.set(name, {
      image: img,
      frameWidth,
      frameHeight,
      frameCount,
      framesPerRow
    });
  }

  // Initialize default placeholder sprites
  public async initializePlaceholderSprites(): Promise<void> {
    // Create walker placeholder sprites with different colors for each area
    const walkerColors = [
      ['#ff6b6b', '#ff8e8e', '#ffb1b1', '#ffd4d4'], // Area 1 - Red tones
      ['#4ecdc4', '#71d4cc', '#94dbd4', '#b7e2dc'], // Area 2 - Teal tones  
      ['#45b7d1', '#68c5d9', '#8bd3e1', '#aee1e9'], // Area 3 - Blue tones
    ];

    for (let i = 0; i < walkerColors.length; i++) {
      this.createPlaceholderSprite(
        `walker_area_${i + 1}`,
        16, 16, 4,
        walkerColors[i]
      );
    }

    // Create zombie placeholder sprite
    const zombieColors = ['#8B0000', '#A52A2A', '#DC143C', '#B22222'];
    this.createPlaceholderSprite(
      'zombie',
      16, 16, 4,
      zombieColors
    );

    console.log('Placeholder sprites initialized');
  }
}