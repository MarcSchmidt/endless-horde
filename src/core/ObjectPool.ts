// Object pool for efficient entity management
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10, maxSize: number = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  // Get an object from the pool
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    // Pool is empty, create new object
    return this.createFn();
  }

  // Return an object to the pool
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
    // If pool is full, let object be garbage collected
  }

  // Get current pool size
  getPoolSize(): number {
    return this.pool.length;
  }

  // Clear the pool
  clear(): void {
    this.pool = [];
  }
}