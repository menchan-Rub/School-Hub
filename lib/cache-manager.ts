type CacheItem<T> = {
  data: T
  timestamp: number
}

export class CacheManager<T> {
  private cache: Map<string, CacheItem<T>>
  private ttl: number

  constructor(ttlInSeconds: number = 300) { // デフォルト5分
    this.cache = new Map()
    this.ttl = ttlInSeconds * 1000
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  remove(key: string): void {
    this.cache.delete(key)
  }
}

export const messageCache = new CacheManager<any>(60) // 1分
export const userCache = new CacheManager<any>(300) // 5分
export const roleCache = new CacheManager<any>(600) // 10分 