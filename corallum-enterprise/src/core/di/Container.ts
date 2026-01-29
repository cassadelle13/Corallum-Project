// Dependency Injection Container
// Решает проблемы циклических зависимостей

export interface IDataManager {
  saveWorkflow(workflow: any): Promise<any>;
  getWorkflow(id: string): Promise<any>;
  listWorkflows(): Promise<any[]>;
  saveExecution(execution: any): Promise<any>;
  getExecution(id: string): Promise<any>;
}

export interface IAIManager {
  generateWorkflow(request: any): Promise<any>;
  healthCheck(): Promise<any>;
}

export interface IReliabilityManager {
  startExecution(workflowId: string, definition: any, input: any): Promise<string>;
  getExecutionStatus(id: string): Promise<any>;
  getMetrics(): Promise<any>;
}

export interface IEnterpriseManager {
  authenticateUser(email: string, password: string): Promise<any>;
  hasPermission(userId: string, permission: any): Promise<boolean>;
  getTenant(tenantId: string): Promise<any>;
}

export class DIContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  register<T>(key: string, factory: () => T, singleton = false): void {
    this.services.set(key, { factory, singleton });
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }

    if (service.singleton) {
      if (!this.singletons.has(key)) {
        this.singletons.set(key, service.factory());
      }
      return this.singletons.get(key);
    }

    return service.factory();
  }

  // Singleton instance
  private static instance: DIContainer;
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
}

// Глобальный контейнер
export const container = DIContainer.getInstance();
