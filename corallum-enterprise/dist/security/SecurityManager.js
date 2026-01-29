"use strict";
// Enterprise Security Manager
// Решает проблемы безопасности и валидации
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityManager = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.SecurityManager = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
class SecurityManager {
    constructor(jwtSecret, bcryptRounds = 12) {
        // Валидация схем
        this.schemas = {
            login: zod_1.z.object({
                email: zod_1.z.string().email('Invalid email format'),
                password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
            }),
            workflowGeneration: zod_1.z.object({
                description: zod_1.z.string().min(10, 'Description too short').max(1000),
                businessContext: zod_1.z.string().optional(),
                industry: zod_1.z.string().optional(),
                constraints: zod_1.z.record(zod_1.z.any()).optional()
            }),
            tenant: zod_1.z.object({
                name: zod_1.z.string().min(2).max(100),
                slug: zod_1.z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format')
            })
        };
        // Rate limiting
        this.rateLimitMap = new Map();
        this.jwtSecret = jwtSecret;
        this.bcryptRounds = bcryptRounds;
    }
    // Валидация данных
    validate(schema, data) {
        const result = this.schemas[schema].safeParse(data);
        if (!result.success) {
            throw new ValidationError(result.error.errors);
        }
        return result.data;
    }
    // Генерация JWT токена
    generateToken(payload, expiresIn = '24h') {
        const options = { expiresIn: expiresIn };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, options);
    }
    // Верификация JWT токена
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new AuthenticationError('Invalid token');
        }
    }
    // Хеширование пароля
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, this.bcryptRounds);
    }
    // Проверка пароля
    async verifyPassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    clearRateLimits() {
        this.rateLimitMap.clear();
    }
    checkRateLimit(key, limit, windowMs) {
        const now = Date.now();
        const record = this.rateLimitMap.get(key);
        if (!record || now > record.resetTime) {
            this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }
        if (record.count >= limit) {
            return false;
        }
        record.count++;
        return true;
    }
    // Sanitization данных
    sanitizeInput(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        const sanitized = Array.isArray(data) ? [] : Object.create(null);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // Удаляем потенциально опасные ключи
                if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype')) {
                    continue;
                }
                const value = data[key];
                if (typeof value === 'string') {
                    // Sanitize строк
                    sanitized[key] = value
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/javascript:/gi, '')
                        .trim();
                }
                else if (typeof value === 'object' && value !== null) {
                    // Рекурсивная обработка объектов
                    sanitized[key] = this.sanitizeInput(value);
                }
                else {
                    sanitized[key] = value;
                }
            }
        }
        return sanitized;
    }
    // CSP заголовки
    getCSPHeaders() {
        return {
            'Content-Security-Policy': [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self'",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'"
            ].join('; '),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
    }
}
exports.SecurityManager = SecurityManager;
// Custom errors
class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed');
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
// Singleton
exports.securityManager = new SecurityManager(process.env.JWT_SECRET || 'change-in-production', parseInt(process.env.BCRYPT_ROUNDS || '12'));
//# sourceMappingURL=SecurityManager.js.map