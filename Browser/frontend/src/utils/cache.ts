interface CacheOptions {
  maxSize?: number;
  maxAge?: number;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

class Cache<T> {
  private items: Map<string, CacheItem<T>>;
  private maxSize: number;
  private maxAge: number;

  constructor(options: CacheOptions = {}) {
    this.items = new Map();
    this.maxSize = options.maxSize || 100;
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 5分
  }

  set(key: string, value: T): void {
    this.cleanup();
    
    if (this.items.size >= this.maxSize) {
      const oldestKey = this.items.keys().next().value;
      this.items.delete(oldestKey);
    }

    this.items.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | undefined {
    const item = this.items.get(key);
    if (!item) return undefined;

    if (this.isExpired(item)) {
      this.items.delete(key);
      return undefined;
    }

    return item.value;
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > this.maxAge;
  }

  private cleanup(): void {
    for (const [key, item] of this.items.entries()) {
      if (this.isExpired(item)) {
        this.items.delete(key);
      }
    }
  }

  clear(): void {
    this.items.clear();
  }

  size(): number {
    return this.items.size;
  }
}

export const pageCache = new Cache<string>({ maxSize: 50, maxAge: 5 * 60 * 1000 }); // 5分
export const resourceCache = new Cache<ArrayBuffer>({ maxSize: 100, maxAge: 30 * 60 * 1000 }); // 30分 