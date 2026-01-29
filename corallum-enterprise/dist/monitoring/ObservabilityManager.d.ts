import { EventEmitter } from 'events';
export interface LogContext {
    userId?: string;
    tenantId?: string;
    requestId?: string;
    operation?: string;
    duration?: number;
    error?: Error;
    metadata?: Record<string, any>;
    success?: boolean;
    method?: string;
    path?: string;
    failures?: number;
    promise?: string;
    ip?: string;
    statusCode?: number;
    state?: string;
}
export interface MetricValue {
    value: number;
    timestamp: Date;
    labels?: Record<string, string>;
}
export declare class ObservabilityManager extends EventEmitter {
    private logger;
    private metrics;
    private alerts;
    private healthChecks;
    constructor();
    private setupLogger;
    private setupMetrics;
    private setupAlerts;
    logInfo(message: string, context?: LogContext): void;
    logError(message: string, error: Error, context?: LogContext): void;
    logWarning(message: string, context?: LogContext): void;
    logDebug(message: string, context?: LogContext): void;
    initializeMetric(name: string, description: string): void;
    recordMetric(name: string, value: number, labels?: Record<string, string>): void;
    incrementMetric(name: string, labels?: Record<string, string>): void;
    gaugeMetric(name: string, value: number, labels?: Record<string, string>): void;
    timerMetric(name: string): () => void;
    measureOperation<T>(operationName: string, operation: () => Promise<T>, context?: LogContext): Promise<T>;
    registerHealthCheck(name: string, check: () => Promise<boolean>): void;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, boolean>;
        timestamp: Date;
    }>;
    private setupAlert;
    private checkAlerts;
    private checkErrorRate;
    private checkResponseTime;
    private checkSuccessRate;
    private checkCachePerformance;
    getMetrics(): Record<string, any>;
    start(): void;
    private cleanupMetrics;
    requestTracing(): (req: any, res: any, next: any) => void;
}
export declare const observability: ObservabilityManager;
//# sourceMappingURL=ObservabilityManager.d.ts.map