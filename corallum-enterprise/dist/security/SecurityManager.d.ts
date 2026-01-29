export declare class SecurityManager {
    private jwtSecret;
    private bcryptRounds;
    constructor(jwtSecret: string, bcryptRounds?: number);
    private schemas;
    validate<T>(schema: keyof typeof this.schemas, data: unknown): T;
    generateToken(payload: any, expiresIn?: string | number): string;
    verifyToken(token: string): any;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    private rateLimitMap;
    clearRateLimits(): void;
    checkRateLimit(key: string, limit: number, windowMs: number): boolean;
    sanitizeInput(data: any): any;
    getCSPHeaders(): Record<string, string>;
}
export declare class ValidationError extends Error {
    errors: any[];
    constructor(errors: any[]);
}
export declare class AuthenticationError extends Error {
    constructor(message: string);
}
export declare class AuthorizationError extends Error {
    constructor(message: string);
}
export declare const securityManager: SecurityManager;
//# sourceMappingURL=SecurityManager.d.ts.map