"use strict";
// Performance and Cache Manager
// Решает проблемы производительности и кэширования
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.QueryOptimizer = exports.CacheManager = void 0;
const redis_1 = require("redis");
class CacheManager {
    constructor(redisConfig) {
        this.localCache = new Map();
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
        this.redis = (0, redis_1.createClient)(redisConfig || {
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
    async get(key) {
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
        }
        catch (error) {
            console.error('Cache get error:', error);
            this.metrics.misses++;
            return null;
        }
    }
    async set(key, data, options = {}) {
        try {
            const ttl = options.ttl || 3600; // Default 1 hour
            const value = JSON.stringify(data);
            // Set in Redis
            if (ttl > 0) {
                await this.redis.setex(key, ttl, value);
            }
            else {
                await this.redis.set(key, value);
            }
            // Set in local cache
            this.setLocal(key, data, Math.min(ttl, 300)); // Max 5 minutes in memory
            // Store tags for invalidation
            if (options.tags && options.tags.length > 0) {
                await this.addTags(key, options.tags);
            }
            this.metrics.sets++;
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    async delete(key) {
        try {
            await this.redis.del(key);
            this.localCache.delete(key);
            this.metrics.deletes++;
        }
        catch (error) {
            console.error('Cache delete error:', error);
        }
    }
    clear() {
        this.localCache.clear();
    }
    // Tag-based cache invalidation
    async invalidateByTag(tag) {
        try {
            const taggedKeys = await this.redis.smembers(`tag:${tag}`);
            if (taggedKeys.length > 0) {
                await this.redis.del(...taggedKeys);
                // Clear from local cache
                taggedKeys.forEach(key => this.localCache.delete(key));
            }
        }
        catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
    // Cache warming
    async warmCache(data) {
        const promises = Object.entries(data).map(([key, { data, options }]) => this.set(key, data, options));
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
    setLocal(key, data, ttlSeconds) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.localCache.set(key, { data, expiry });
    }
    cleanupLocalCache() {
        const now = Date.now();
        for (const [key, entry] of this.localCache.entries()) {
            if (entry.expiry <= now) {
                this.localCache.delete(key);
            }
        }
    }
    async addTags(key, tags) {
        const promises = tags.map(tag => this.redis.sadd(`tag:${tag}`, key));
        await Promise.all(promises);
    }
    // Advanced caching patterns
    async getOrSet(key, fetcher, options = {}) {
        let data = await this.get(key);
        if (data === null) {
            data = await fetcher();
            await this.set(key, data, options);
        }
        return data;
    }
    // Distributed cache locking
    async acquireLock(key, ttl = 30) {
        const lockKey = `lock:${key}`;
        const lockValue = `${Date.now()}-${Math.random()}`;
        const result = await this.redis.set(lockKey, lockValue, 'PX', ttl * 1000, 'NX');
        return result === 'OK' ? lockValue : null;
    }
    async releaseLock(key, lockValue) {
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
    async close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (this.redis) {
            await this.redis.quit();
        }
    }
}
exports.CacheManager = CacheManager;
// Query optimization helper
class QueryOptimizer {
    // Connection pooling
    static createPool(config) {
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
    static async batchQuery(pool, query, params) {
        const client = await pool.connect();
        try {
            const results = await Promise.all(params.map(param => client.query(query, param)));
            return results.flatMap(result => result.rows);
        }
        finally {
            client.release();
        }
    }
    // Pagination helper
    static buildPaginationQuery(baseQuery, page, limit) {
        const offset = (page - 1) * limit;
        return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
    }
}
exports.QueryOptimizer = QueryOptimizer;
// Singleton
exports.cacheManager = new CacheManager();
//# sourceMappingURL=CacheManager.js.map