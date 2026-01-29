// Security Manager Tests
// Тестируем безопасность и валидацию

import { securityManager, ValidationError, AuthenticationError } from '../../src/security/SecurityManager';
import { TestUtils } from '../setup/test-setup';

describe('SecurityManager', () => {
  describe('Input Validation', () => {
    it('should validate login data correctly', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = securityManager.validate('login', validLogin);
      expect(result).toEqual(validLogin);
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123'
      };

      expect(() => {
        securityManager.validate('login', invalidLogin);
      }).toThrow(ValidationError);
    });

    it('should reject short password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '123'
      };

      expect(() => {
        securityManager.validate('login', invalidLogin);
      }).toThrow(ValidationError);
    });

    it('should validate workflow generation request', () => {
      const validRequest = {
        description: 'Create a customer onboarding workflow',
        businessContext: 'SaaS company',
        industry: 'technology'
      };

      const result = securityManager.validate('workflowGeneration', validRequest);
      expect(result).toEqual(validRequest);
    });
  });

  describe('JWT Token Management', () => {
    it('should generate and verify JWT token', () => {
      const payload = { userId: 'test_user', tenantId: 'test_tenant' };
      const token = securityManager.generateToken(payload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      const decoded = securityManager.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.tenantId).toBe(payload.tenantId);
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => {
        securityManager.verifyToken(invalidToken);
      }).toThrow(AuthenticationError);
    });

    it('should handle expired token', () => {
      const payload = { userId: 'test_user' };
      const token = securityManager.generateToken(payload, '1ms');
      
      // Wait for token to expire
      return TestUtils.waitFor(10).then(() => {
        expect(() => {
          securityManager.verifyToken(token);
        }).toThrow(AuthenticationError);
      });
    });
  });

  describe('Password Security', () => {
    it('should hash and verify passwords', async () => {
      const password = 'testPassword123';
      const hash = await securityManager.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      
      const isValid = await securityManager.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await securityManager.hashPassword(password);
      
      const isValid = await securityManager.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const key = 'test_key';
      const limit = 5;
      const windowMs = 1000;

      for (let i = 0; i < limit; i++) {
        expect(securityManager.checkRateLimit(key, limit, windowMs)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const key = 'test_key';
      const limit = 2;
      const windowMs = 1000;

      expect(securityManager.checkRateLimit(key, limit, windowMs)).toBe(true);
      expect(securityManager.checkRateLimit(key, limit, windowMs)).toBe(true);
      expect(securityManager.checkRateLimit(key, limit, windowMs)).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious scripts', () => {
      const maliciousInput = {
        message: '<script>alert("xss")</script>Hello',
        safe: 'This is safe',
        nested: {
          dangerous: 'javascript:alert("xss")',
          clean: 'safe content'
        }
      };

      const sanitized = securityManager.sanitizeInput(maliciousInput);

      expect(sanitized.message).toBe('Hello');
      expect(sanitized.safe).toBe('This is safe');
      expect(sanitized.nested.dangerous).toBe('alert("xss")');
      expect(sanitized.nested.clean).toBe('safe content');
    });

    it('should remove prototype pollution attempts', () => {
      const maliciousInput = {
        '__proto__': { polluted: true },
        'constructor': { polluted: true },
        'prototype': { polluted: true },
        'normal': 'safe'
      };

      const sanitized = securityManager.sanitizeInput(maliciousInput);

      expect(sanitized.__proto__).toBeUndefined();
      expect(sanitized.constructor).toBeUndefined();
      expect(sanitized.prototype).toBeUndefined();
      expect(sanitized.normal).toBe('safe');
    });
  });

  describe('CSP Headers', () => {
    it('should generate proper CSP headers', () => {
      const headers = securityManager.getCSPHeaders();

      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    });
  });
});
