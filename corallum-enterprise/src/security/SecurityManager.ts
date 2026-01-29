// Enterprise Security Manager
// Решает проблемы безопасности и валидации

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';

export class SecurityManager {
  private jwtSecret: string;
  private bcryptRounds: number;

  constructor(jwtSecret: string, bcryptRounds = 12) {
    this.jwtSecret = jwtSecret;
    this.bcryptRounds = bcryptRounds;
  }

  // Валидация схем
  private schemas = {
    login: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters')
    }),
    
    workflowGeneration: z.object({
      description: z.string().min(10, 'Description too short').max(1000),
      businessContext: z.string().optional(),
      industry: z.string().optional(),
      constraints: z.record(z.any()).optional()
    }),

    tenant: z.object({
      name: z.string().min(2).max(100),
      slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format')
    })
  };

  // Валидация данных
  validate<T>(schema: keyof typeof this.schemas, data: unknown): T {
    const result = this.schemas[schema].safeParse(data);
    if (!result.success) {
      throw new ValidationError(result.error.errors);
    }
    return result.data as T;
  }

  // Генерация JWT токена
  generateToken(payload: any, expiresIn: string | number = '24h'): string {
    const options: jwt.SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  // Верификация JWT токена
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  // Хеширование пароля
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  // Проверка пароля
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Rate limiting
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  clearRateLimits(): void {
    this.rateLimitMap.clear();
  }
  
  checkRateLimit(key: string, limit: number, windowMs: number): boolean {
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
  sanitizeInput(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = Array.isArray(data) ? [] : Object.create(null);

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
        } else if (typeof value === 'object' && value !== null) {
          // Рекурсивная обработка объектов
          sanitized[key] = this.sanitizeInput(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  // CSP заголовки
  getCSPHeaders(): Record<string, string> {
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

// Custom errors
export class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Singleton
export const securityManager = new SecurityManager(
  process.env.JWT_SECRET || 'change-in-production',
  parseInt(process.env.BCRYPT_ROUNDS || '12')
);
