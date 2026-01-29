import { Request, Response, NextFunction } from 'express';
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
export declare class ErrorHandler {
    static handle(error: Error, req: Request, res: Response, next: NextFunction): void;
    private static formatError;
    static asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
}
export declare class CircuitBreaker {
    private threshold;
    private timeout;
    private monitor;
    private failures;
    private lastFailureTime;
    private state;
    constructor(threshold?: number, timeout?: number, // 1 minute
    monitor?: import("../monitoring/ObservabilityManager").ObservabilityManager);
    execute<T>(operation: () => Promise<T>, operationName: string): Promise<T>;
    private recordFailure;
    private reset;
}
export declare const circuitBreaker: CircuitBreaker;
//# sourceMappingURL=ErrorHandler.d.ts.map