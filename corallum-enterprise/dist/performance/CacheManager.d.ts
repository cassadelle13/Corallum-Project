export interface CacheOptions {
    ttl?: number;
    tags?: string[];
}
export declare class CacheManager {
    private redis;
    private localCache;
    private cleanupInterval;
    private metrics;
    constructor(redisConfig?: any);
    get<T>(key: string): Promise<T | null>;
    set(key: string, data: any, options?: CacheOptions): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): void;
    invalidateByTag(tag: string): Promise<void>;
    warmCache(data: Record<string, {
        data: any;
        options?: CacheOptions;
    }>): Promise<void>;
    getMetrics(): {
        hitRate: number;
        localCacheSize: number;
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
    };
    private setLocal;
    private cleanupLocalCache;
    private addTags;
    getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T>;
    acquireLock(key: string, ttl?: number): Promise<string | null>;
    releaseLock(key: string, lockValue: string): Promise<boolean>;
    close(): Promise<void>;
}
export declare class QueryOptimizer {
    static createPool(config: any): any;
    static batchQuery<T>(pool: any, query: string, params: any[][]): Promise<T[]>;
    static buildPaginationQuery(baseQuery: string, page: number, limit: number): string;
}
export declare const cacheManager: CacheManager;
//# sourceMappingURL=CacheManager.d.ts.map