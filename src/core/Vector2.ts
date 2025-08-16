// Vector2 class for 2D position and velocity management
export class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // Create a copy of this vector
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  // Add another vector to this one
  add(other: Vector2): Vector2 {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  // Subtract another vector from this one
  subtract(other: Vector2): Vector2 {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  // Multiply this vector by a scalar
  multiply(scalar: number): Vector2 {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  // Get the length (magnitude) of this vector
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Normalize this vector (make it unit length)
  normalize(): Vector2 {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  // Get distance to another vector
  distanceTo(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Set the values of this vector
  set(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }

  // Static methods for creating vectors without modifying originals
  static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static multiply(vector: Vector2, scalar: number): Vector2 {
    return new Vector2(vector.x * scalar, vector.y * scalar);
  }

  static random(minX: number, maxX: number, minY: number, maxY: number): Vector2 {
    return new Vector2(
      Math.random() * (maxX - minX) + minX,
      Math.random() * (maxY - minY) + minY
    );
  }
}