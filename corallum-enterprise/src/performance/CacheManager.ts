// Performance and Cache Manager
// Решает проблемы производительности и кэширования

import { createClient } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheManager {
  private redis: any;
  private localCache = new Map<string, { data: any; expiry: number }>();
  private cleanupInterval: ReturnType<typeof setInterval>;
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  constructor(redisConfig?: any) {
    this.redis = createClient(redisConfig || {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    
    this.redis.connect().catch(console.error);

    // Cleanup expired local cache entries
    this.cleanupInterval = setInterval(() => this.cleanupLocalCache(), 60000);
  }

  // Multi-level caching (Memory + Redis)
  async get<T>(key: string): Promise<T | null> {
    try {
      // Level 1: Memory cache
      const localEntry = this.localCache.get(key);
      if (localEntry && localEntry.expiry > Date.now()) {
        this.metrics.hits++;
        return localEntry.data;
      }

      // Level 2: Redis cache
      const redisData = await this.redis.get(key);
      if (redisData) {
        const parsed = JSON.parse(redisData);
        
        // Store in local cache with shorter TTL
        this.setLocal(key, parsed, 300); // 5 minutes local cache
        
        this.metrics.hits++;
        return parsed;
      }

      this.metrics.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 3600; // Default 1 hour
      const value = JSON.stringify(data);

      // Set in Redis
      if (ttl > 0) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }

      // Set in local cache
      this.setLocal(key, data, Math.min(ttl, 300)); // Max 5 minutes in memory

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTags(key, options.tags);
      }

      this.metrics.sets++;
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.localCache.delete(key);
      this.metrics.deletes++;
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  clear(): void {
    this.localCache.clear();
  }

  // Tag-based cache invalidation
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const taggedKeys = await this.redis.smembers(`tag:${tag}`);
      if (taggedKeys.length > 0) {
        await this.redis.del(...taggedKeys);
        
        // Clear from local cache
        taggedKeys.forEach(key => this.localCache.delete(key));
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Cache warming
  async warmCache(data: Record<string, { data: any; options?: CacheOptions }>): Promise<void> {
    const promises = Object.entries(data).map(([key, { data, options }]) =>
      this.set(key, data, options)
    );
    await Promise.all(promises);
  }

  // Cache statistics
  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      localCacheSize: this.localCache.size
    };
  }

  // Private methods
  private setLocal(key: string, data: any, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.localCache.set(key, { data, expiry });
  }

  private cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.localCache.entries()) {
      if (entry.expiry <= now) {
        this.localCache.delete(key);
      }
    }
  }

  private async addTags(key: string, tags: string[]): Promise<void> {
    const promises = tags.map(tag => this.redis.sadd(`tag:${tag}`, key));
    await Promise.all(promises);
  }

  // Advanced caching patterns
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    let data = await this.get<T>(key);
    
    if (data === null) {
      data = await fetcher();
      await this.set(key, data, options);
    }
    
    return data;
  }

  // Distributed cache locking
  async acquireLock(key: string, ttl = 30): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    const result = await this.redis.set(lockKey, lockValue, 'PX', ttl * 1000, 'NX');
    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Query optimization helper
export class QueryOptimizer {
  // Connection pooling
  static createPool(config: any) {
    const { Pool } = require('pg');
    return new Pool({
      ...config,
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Batch operations
  static async batchQuery<T>(
    pool: any, 
    query: string, 
    params: any[][]
  ): Promise<T[]> {
    const client = await pool.connect();
    try {
      const results = await Promise.all(
        params.map(param => client.query(query, param))
      );
      return results.flatMap(result => result.rows);
    } finally {
      client.release();
    }
  }

  // Pagination helper
  static buildPaginationQuery(baseQuery: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
  }
}

// Singleton
export const cacheManager = new CacheManager();
