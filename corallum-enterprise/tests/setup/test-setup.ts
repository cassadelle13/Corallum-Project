// Test Setup Configuration
// Решает проблемы отсутствия тестирования

import { container } from '../../src/core/di/Container';
import { securityManager } from '../../src/security/SecurityManager';
import { cacheManager } from '../../src/performance/CacheManager';
import { observability } from '../../src/monitoring/ObservabilityManager';

// Test database setup
export const testDbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'corallum_test',
  user: 'test_user',
  password: 'test_password',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Mock services for testing
export class MockDataManager {
  private workflows = new Map<string, any>();
  private executions = new Map<string, any>();

  async saveWorkflow(workflow: any) {
    const id = `workflow_${Date.now()}`;
    this.workflows.set(id, { ...workflow, id, created_at: new Date() });
    return this.workflows.get(id);
  }

  async getWorkflow(id: string) {
    return this.workflows.get(id) || null;
  }

  async listWorkflows() {
    return Array.from(this.workflows.values());
  }

  async saveExecution(execution: any) {
    const id = `exec_${Date.now()}`;
    this.executions.set(id, { ...execution, id, created_at: new Date() });
    return this.executions.get(id);
  }

  async getExecution(id: string) {
    return this.executions.get(id) || null;
  }

  clear() {
    this.workflows.clear();
    this.executions.clear();
  }
}

export class MockAIManager {
  async generateWorkflow(request: any) {
    return {
      workflow: {
        id: 'mock_workflow',
        nodes: [{ id: 'node1', type: 'mock' }],
        edges: []
      },
      reasoning: 'Mock AI reasoning',
      confidence: 0.9,
      suggestions: ['Mock suggestion']
    };
  }

  async healthCheck() {
    return { status: 'healthy', provider: 'mock' };
  }
}

export class MockReliabilityManager {
  async startExecution(workflowId: string, definition: any, input: any) {
    return `mock_exec_${Date.now()}`;
  }

  async getExecutionStatus(id: string) {
    return {
      id,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date()
    };
  }

  async getMetrics() {
    return {
      totalExecutions: 100,
      successRate: 99.5,
      uptime: '99.9%'
    };
  }
}

export class MockEnterpriseManager {
  async authenticateUser(email: string, password: string) {
    return {
      user: { id: 'mock_user', email, role: 'admin' },
      token: 'mock_jwt_token'
    };
  }

  async hasPermission(userId: string, permission: any) {
    return true;
  }

  async getTenant(tenantId: string) {
    return {
      id: tenantId,
      name: 'Mock Tenant',
      slug: 'mock'
    };
  }
}

// Test utilities
export class TestUtils {
  static async setupTestDatabase() {
    // Create test database if needed
    // This would connect to PostgreSQL and create test schema
    console.log('Setting up test database...');
  }

  static async cleanupTestDatabase() {
    // Clean up test database
    console.log('Cleaning up test database...');
  }

  static createMockRequest(overrides: any = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: { userId: 'test_user', tenantId: 'test_tenant' },
      requestId: 'test_request',
      startTime: Date.now(),
      ...overrides
    };
  }

  static createMockResponse() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }

  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateTestData() {
    return {
      user: {
        id: 'test_user_id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        tenant_id: 'test_tenant_id'
      },
      tenant: {
        id: 'test_tenant_id',
        name: 'Test Tenant',
        slug: 'test-tenant'
      },
      workflow: {
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [
          {
            id: 'node1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          }
        ],
        edges: []
      },
      execution: {
        workflowId: 'test_workflow_id',
        status: 'running',
        input: { test: 'data' }
      }
    };
  }
}

// Global test setup
beforeAll(async () => {
  // Setup test environment
  await TestUtils.setupTestDatabase();
  
  // Register mock services
  container.register('dataManager', () => new MockDataManager());
  container.register('aiManager', () => new MockAIManager());
  container.register('reliabilityManager', () => new MockReliabilityManager());
  container.register('enterpriseManager', () => new MockEnterpriseManager());
  
  // Start observability
  observability.start();
});

afterAll(async () => {
  // Cleanup
  await TestUtils.cleanupTestDatabase();
  await cacheManager.close();
});

beforeEach(() => {
  // Clear caches and reset state
  cacheManager.clear();
  securityManager.clearRateLimits();
  jest.clearAllMocks();
});

export { container, securityManager, cacheManager, observability };
