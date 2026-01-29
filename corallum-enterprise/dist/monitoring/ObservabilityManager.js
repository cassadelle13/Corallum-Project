"use strict";
// Observability Manager
// Решает проблемы мониторинга, логирования и метрик
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.observability = exports.ObservabilityManager = void 0;
const winston_1 = __importDefault(require("winston"));
const events_1 = require("events");
class ObservabilityManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.alerts = new Map();
        this.healthChecks = new Map();
        this.setupLogger();
        this.setupMetrics();
        this.setupAlerts();
    }
    setupLogger() {
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                message,
                ...meta
            });
        }));
        this.logger = winston_1.default.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports: [
                new winston_1.default.transports.Console(),
                new winston_1.default.transports.File({
                    filename: 'logs/error.log',
                    level: 'error'
                }),
                new winston_1.default.transports.File({
                    filename: 'logs/combined.log'
                })
            ]
        });
    }
    setupMetrics() {
        // Initialize default metrics
        this.initializeMetric('http_requests_total', 'Total HTTP requests');
        this.initializeMetric('http_request_duration_seconds', 'HTTP request duration');
        this.initializeMetric('workflow_executions_total', 'Total workflow executions');
        this.initializeMetric('workflow_success_rate', 'Workflow success rate');
        this.initializeMetric('active_users_total', 'Active users');
        this.initializeMetric('ai_requests_total', 'AI requests');
        this.initializeMetric('cache_hit_rate', 'Cache hit rate');
    }
    setupAlerts() {
        // Setup default alerts
        this.setupAlert('high_error_rate', () => this.checkErrorRate());
        this.setupAlert('high_response_time', () => this.checkResponseTime());
        this.setupAlert('low_success_rate', () => this.checkSuccessRate());
        this.setupAlert('cache_performance', () => this.checkCachePerformance());
    }
    // Structured logging
    logInfo(message, context = {}) {
        this.logger.info(message, context);
        this.emit('log', { level: 'info', message, context });
    }
    logError(message, error, context = {}) {
        this.logger.error(message, { ...context, error: error.message, stack: error.stack });
        this.emit('log', { level: 'error', message, context, error });
        // Increment error metric
        this.incrementMetric('http_requests_total', { status: 'error' });
    }
    logWarning(message, context = {}) {
        this.logger.warning(message, context);
        this.emit('log', { level: 'warning', message, context });
    }
    logDebug(message, context = {}) {
        this.logger.debug(message, context);
    }
    // Metrics collection
    initializeMetric(name, description) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
    }
    recordMetric(name, value, labels) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.push({
                value,
                timestamp: new Date(),
                labels
            });
            // Keep only last 1000 data points
            if (metric.length > 1000) {
                metric.splice(0, metric.length - 1000);
            }
        }
    }
    incrementMetric(name, labels) {
        const metric = this.metrics.get(name);
        const currentValue = metric && metric.length > 0
            ? metric[metric.length - 1].value
            : 0;
        this.recordMetric(name, currentValue + 1, labels);
    }
    gaugeMetric(name, value, labels) {
        this.recordMetric(name, value, labels);
    }
    timerMetric(name) {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.recordMetric(name, duration / 1000); // Convert to seconds
        };
    }
    // Performance monitoring
    async measureOperation(operationName, operation, context = {}) {
        const timer = this.timerMetric('operation_duration_seconds');
        const startTime = Date.now();
        try {
            this.logInfo(`Starting operation: ${operationName}`, context);
            const result = await operation();
            const duration = Date.now() - startTime;
            this.logInfo(`Completed operation: ${operationName}`, {
                ...context,
                duration,
                success: true
            });
            this.recordMetric('operation_duration_seconds', duration / 1000, {
                operation: operationName,
                status: 'success'
            });
            timer();
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logError(`Failed operation: ${operationName}`, error, {
                ...context,
                duration,
                success: false
            });
            this.recordMetric('operation_duration_seconds', duration / 1000, {
                operation: operationName,
                status: 'error'
            });
            timer();
            throw error;
        }
    }
    // Health checks
    registerHealthCheck(name, check) {
        this.healthChecks.set(name, check);
    }
    async getHealthStatus() {
        const checks = {};
        let healthyCount = 0;
        const totalCount = this.healthChecks.size;
        for (const [name, check] of this.healthChecks) {
            try {
                checks[name] = await check();
                if (checks[name])
                    healthyCount++;
            }
            catch (error) {
                checks[name] = false;
            }
        }
        const status = totalCount === 0 ? 'healthy' :
            healthyCount === totalCount ? 'healthy' :
                healthyCount > totalCount / 2 ? 'degraded' : 'unhealthy';
        return {
            status,
            checks,
            timestamp: new Date()
        };
    }
    // Alerting
    setupAlert(name, condition) {
        this.alerts.set(name, { condition, lastTriggered: null });
    }
    async checkAlerts() {
        for (const [name, alert] of this.alerts) {
            try {
                const shouldTrigger = await alert.condition();
                if (shouldTrigger && !alert.lastTriggered) {
                    this.emit('alert', { name, message: `Alert triggered: ${name}` });
                    alert.lastTriggered = new Date();
                }
                else if (!shouldTrigger && alert.lastTriggered) {
                    alert.lastTriggered = null;
                }
            }
            catch (error) {
                this.logError(`Alert check failed: ${name}`, error);
            }
        }
    }
    // Alert conditions
    async checkErrorRate() {
        const errorMetric = this.metrics.get('http_requests_total');
        if (!errorMetric || errorMetric.length < 100)
            return false;
        const recentErrors = errorMetric
            .slice(-100)
            .filter(m => m.labels?.status === 'error').length;
        return recentErrors > 10; // Alert if >10% error rate
    }
    async checkResponseTime() {
        const durationMetric = this.metrics.get('http_request_duration_seconds');
        if (!durationMetric || durationMetric.length < 10)
            return false;
        const avgDuration = durationMetric
            .slice(-10)
            .reduce((sum, m) => sum + m.value, 0) / 10;
        return avgDuration > 5; // Alert if avg response time > 5s
    }
    async checkSuccessRate() {
        const workflowMetric = this.metrics.get('workflow_success_rate');
        if (!workflowMetric || workflowMetric.length === 0)
            return false;
        const latestRate = workflowMetric[workflowMetric.length - 1].value;
        return latestRate < 95; // Alert if success rate < 95%
    }
    async checkCachePerformance() {
        const cacheMetric = this.metrics.get('cache_hit_rate');
        if (!cacheMetric || cacheMetric.length === 0)
            return false;
        const latestRate = cacheMetric[cacheMetric.length - 1].value;
        return latestRate < 80; // Alert if cache hit rate < 80%
    }
    // Export metrics for monitoring systems
    getMetrics() {
        const result = {};
        for (const [name, values] of this.metrics) {
            if (values.length > 0) {
                const latest = values[values.length - 1];
                result[name] = {
                    current: latest.value,
                    labels: latest.labels,
                    timestamp: latest.timestamp,
                    count: values.length
                };
            }
        }
        return result;
    }
    // Start background monitoring
    start() {
        // Check alerts every 30 seconds
        setInterval(() => this.checkAlerts(), 30000);
        // Cleanup old metrics every hour
        setInterval(() => this.cleanupMetrics(), 3600000);
        this.logInfo('Observability manager started');
    }
    cleanupMetrics() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        for (const [name, values] of this.metrics) {
            const filtered = values.filter(m => m.timestamp > cutoff);
            this.metrics.set(name, filtered);
        }
    }
    // Request tracing middleware
    requestTracing() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.requestId = requestId;
            req.startTime = Date.now();
            // Log request start
            this.logInfo('Request started', {
                requestId,
                method: req.method,
                path: req.path,
                ip: req.ip
            });
            // Log response
            res.on('finish', () => {
                const duration = Date.now() - req.startTime;
                this.logInfo('Request completed', {
                    requestId,
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration
                });
                this.recordMetric('http_request_duration_seconds', duration / 1000, {
                    method: req.method,
                    path: req.path,
                    status: res.statusCode.toString()
                });
                this.incrementMetric('http_requests_total', {
                    method: req.method,
                    status: res.statusCode.toString()
                });
            });
            next();
        };
    }
}
exports.ObservabilityManager = ObservabilityManager;
// Singleton
exports.observability = new ObservabilityManager();
//# sourceMappingURL=ObservabilityManager.js.map