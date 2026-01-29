"use strict";
// Global Error Handler
// Централизованная обработка ошибок
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreaker = exports.CircuitBreaker = exports.ErrorHandler = void 0;
const ObservabilityManager_1 = require("../monitoring/ObservabilityManager");
class ErrorHandler {
    static handle(error, req, res, next) {
        const errorResponse = this.formatError(error, req);
        // Log error
        ObservabilityManager_1.observability.logError('Request failed', error, {
            requestId: req.headers['x-request-id'],
            method: req.method,
            path: req.path,
            userId: req.user?.userId,
            tenantId: req.user?.tenantId
        });
        // Send response
        res.status(errorResponse.status).json(errorResponse.body);
    }
    static formatError(error, req) {
        // Known error types
        if (error.name === 'ValidationError') {
            return {
                status: 400,
                body: {
                    error: 'Validation failed',
                    details: error.errors,
                    requestId: req.headers['x-request-id']
                }
            };
        }
        if (error.name === 'AuthenticationError') {
            return {
                status: 401,
                body: {
                    error: 'Authentication failed',
                    message: error.message,
                    requestId: req.headers['x-request-id']
                }
            };
        }
        if (error.name === 'AuthorizationError') {
            return {
                status: 403,
                body: {
                    error: 'Access denied',
                    message: error.message,
                    requestId: req.headers['x-request-id']
                }
            };
        }
        if (error.name === 'CastError') {
            return {
                status: 400,
                body: {
                    error: 'Invalid data format',
                    requestId: req.headers['x-request-id']
                }
            };
        }
        // Default error
        const isDevelopment = process.env.NODE_ENV === 'development';
        return {
            status: 500,
            body: {
                error: isDevelopment ? error.message : 'Internal server error',
                requestId: req.headers['x-request-id'],
                ...(isDevelopment && { stack: error.stack })
            }
        };
    }
    // Async error wrapper
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}
exports.ErrorHandler = ErrorHandler;
// Circuit Breaker Pattern
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000, // 1 minute
    monitor = ObservabilityManager_1.observability) {
        this.threshold = threshold;
        this.timeout = timeout;
        this.monitor = monitor;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'CLOSED';
    }
    async execute(operation, operationName) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            }
            else {
                throw new Error(`Circuit breaker OPEN for ${operationName}`);
            }
        }
        try {
            const result = await operation();
            if (this.state === 'HALF_OPEN') {
                this.reset();
            }
            return result;
        }
        catch (error) {
            this.recordFailure(operationName);
            throw error;
        }
    }
    recordFailure(operationName) {
        this.failures++;
        this.lastFailureTime = Date.now();
        this.monitor.logError(`Circuit breaker failure: ${operationName}`, new Error('Circuit breaker tripped'), {
            failures: this.failures,
            state: this.state
        });
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            this.monitor.logError(`Circuit breaker OPENED: ${operationName}`, new Error('Circuit breaker opened'));
        }
    }
    reset() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
}
exports.CircuitBreaker = CircuitBreaker;
exports.circuitBreaker = new CircuitBreaker();
//# sourceMappingURL=ErrorHandler.js.map