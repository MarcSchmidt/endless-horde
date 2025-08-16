// Batch renderer for optimized entity rendering
import { PerformanceMonitor } from './PerformanceMonitor.ts';

export interface RenderBatch {
  texture?: HTMLImageElement | HTMLCanvasElement;
  color?: string;
  items: RenderItem[];
}

export interface RenderItem {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  alpha?: number;
  rotation?: number;
}

export class BatchRenderer {
  private static instance: BatchRenderer;
  private batches: Map<string, RenderBatch> = new Map();
  private performanceMonitor: PerformanceMonitor;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): BatchRenderer {
    if (!BatchRenderer.instance) {
      BatchRenderer.instance = new BatchRenderer();
    }
    return BatchRenderer.instance;
  }

  // Add an item to a batch
  addToBatch(batchKey: string, item: RenderItem, texture?: HTMLImageElement | HTMLCanvasElement, color?: string): void {
    let batch = this.batches.get(batchKey);
    
    if (!batch) {
      batch = {
        texture,
        color,
        items: []
      };
      this.batches.set(batchKey, batch);
    }
    
    batch.items.push(item);
  }

  // Render all batches
  renderBatches(ctx: CanvasRenderingContext2D): void {
    const useReducedQuality = this.performanceMonitor.shouldUseReducedQuality();
    
    for (const [, batch] of this.batches) {
      if (batch.items.length === 0) continue;
      
      ctx.save();
      
      // Set batch-wide properties
      if (batch.color) {
        ctx.fillStyle = batch.color;
      }
      
      // Render all items in the batch
      if (batch.texture) {
        this.renderTextureBatch(ctx, batch, useReducedQuality);
      } else {
        this.renderColorBatch(ctx, batch, useReducedQuality);
      }
      
      ctx.restore();
      
      // Track render call
      this.performanceMonitor.incrementRenderCalls();
    }
    
    // Clear batches for next frame
    this.clearBatches();
  }

  // Render a batch of textured items
  private renderTextureBatch(ctx: CanvasRenderingContext2D, batch: RenderBatch, useReducedQuality: boolean): void {
    if (!batch.texture) return;
    
    for (const item of batch.items) {
      // Skip very small items in reduced quality mode
      if (useReducedQuality && (item.width < 4 || item.height < 4)) {
        continue;
      }
      
      ctx.save();
      
      // Apply alpha if specified
      if (item.alpha !== undefined) {
        ctx.globalAlpha = item.alpha;
      }
      
      // Apply rotation if specified
      if (item.rotation) {
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        ctx.translate(-item.width / 2, -item.height / 2);
      }
      
      // Draw the texture
      if (item.sourceX !== undefined && item.sourceY !== undefined && 
          item.sourceWidth !== undefined && item.sourceHeight !== undefined) {
        // Draw with source rectangle (sprite sheet)
        ctx.drawImage(
          batch.texture,
          item.sourceX, item.sourceY, item.sourceWidth, item.sourceHeight,
          item.rotation ? 0 : item.x, item.rotation ? 0 : item.y, item.width, item.height
        );
      } else {
        // Draw entire texture
        ctx.drawImage(
          batch.texture,
          item.rotation ? 0 : item.x, item.rotation ? 0 : item.y, item.width, item.height
        );
      }
      
      ctx.restore();
    }
  }

  // Render a batch of colored rectangles
  private renderColorBatch(ctx: CanvasRenderingContext2D, batch: RenderBatch, useReducedQuality: boolean): void {
    if (!batch.color) return;
    
    // Use path batching for better performance
    ctx.beginPath();
    
    for (const item of batch.items) {
      // Skip very small items in reduced quality mode
      if (useReducedQuality && (item.width < 2 || item.height < 2)) {
        continue;
      }
      
      if (item.rotation) {
        // Handle rotated rectangles individually
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
      } else {
        // Add to batch path
        ctx.rect(item.x, item.y, item.width, item.height);
      }
    }
    
    ctx.fill();
  }

  // Clear all batches
  clearBatches(): void {
    for (const batch of this.batches.values()) {
      batch.items = [];
    }
  }

  // Get batch count for debugging
  getBatchCount(): number {
    return this.batches.size;
  }

  // Get total items across all batches
  getTotalItems(): number {
    let total = 0;
    for (const batch of this.batches.values()) {
      total += batch.items.length;
    }
    return total;
  }
}