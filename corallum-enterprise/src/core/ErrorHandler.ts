// Global Error Handler
// Централизованная обработка ошибок

import { Request, Response, NextFunction } from 'express';
import { observability } from '../monitoring/ObservabilityManager';

// Расширяем интерфейс Request для поддержки user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        role: string;
      };
      requestId?: string;
      startTime?: number;
      rawBody?: Buffer;
    }
  }
}

export class ErrorHandler {
  static handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    const errorResponse = this.formatError(error, req);
    
    // Log error
    observability.logError('Request failed', error, {
      requestId: req.headers['x-request-id'] as string,
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      tenantId: req.user?.tenantId
    });

    // Send response
    res.status(errorResponse.status).json(errorResponse.body);
  }

  private static formatError(error: Error, req: Request): { status: number; body: any } {
    // Known error types
    if (error.name === 'ValidationError') {
      return {
        status: 400,
        body: {
          error: 'Validation failed',
          details: (error as any).errors,
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
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Circuit Breaker Pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private monitor = observability
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker OPEN for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure(operationName);
      throw error;
    }
  }

  private recordFailure(operationName: string): void {
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

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

export const circuitBreaker = new CircuitBreaker();
