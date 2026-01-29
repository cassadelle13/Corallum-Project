# Microservices Architecture Design
# Переход от монолита к микросервисам для 95/100 готовности

## 🎯 ЦЕЛЬ: 87/100 → 95/100

### **Current Architecture (Monolith)**
```
┌─────────────────────────────────────┐
│        Corallum Enterprise         │
│  ┌─────────────┬─────────────────┐  │
│  │ Enterprise  │      AI         │  │
│  │   Manager   │   Manager       │  │
│  ├─────────────┼─────────────────┤  │
│  │ Reliability │    Database     │  │
│  │   Manager   │   PostgreSQL    │  │
│  └─────────────┴─────────────────┘  │
└─────────────────────────────────────┘
```

### **Target Architecture (Microservices)**
```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Kong/Nginx)  │
                    └─────────┬───────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌────────▼────────┐    ┌───────▼──────┐
│   Auth Svc   │    │  Workflow Svc   │    │   AI Svc     │
│              │    │                 │    │              │
│ - JWT        │    │ - Execution     │    │ - LangChain  │
│ - SSO        │    │ - Orchestration │    │ - RAG        │
│ - RBAC       │    │ - State Mgmt    │    │ - Models     │
└──────────────┘    └─────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌────────▼────────┐    ┌───────▼──────┐
│Tenant Svc    │    │  Reliability    │    │Analytics Svc │
│              │    │     Svc         │    │              │
│ - Management │    │ - Inngest       │    │ - Metrics    │
│ - Isolation  │    │ - Retries       │    │ - Reports    │
│ - Billing    │    │ - Monitoring    │    │ - ML Ops     │
└──────────────┘    └─────────────────┘    └──────────────┘
                              │
                    ┌─────────▼───────┐
                    │  Data Layer     │
                    │                 │
                    │ PostgreSQL      │
                    │ Redis Cluster   │
                    │ Elasticsearch   │
                    │ S3 Storage      │
                    └─────────────────┘
```

---

## 🏗️ ПЛАН МИГРАЦИИ

### **Phase 1: Service Extraction (Week 1-2)**
1. **Auth Service** - Выделить аутентификацию
2. **Database Separation** - Разделить БД по сервисам
3. **API Gateway** - Внедрить Kong/Nginx
4. **Service Discovery** - Consul/Eureka

### **Phase 2: Core Services (Week 3-4)**
1. **Workflow Service** - Основная логика
2. **AI Service** - LangChain интеграция
3. **Reliability Service** - Inngest управление
4. **Inter-service Communication** - gRPC/REST

### **Phase 3: Supporting Services (Week 5-6)**
1. **Tenant Service** - Multi-tenant управление
2. **Analytics Service** - Метрики и отчеты
3. **Notification Service** - Email/Push уведомления
4. **File Service** - Управление файлами

---

## 🔧 ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ

### **1. Auth Service**
```typescript
// services/auth/src/index.ts
import express from 'express';
import { AuthService } from './auth.service';
import { JWTService } from './jwt.service';
import { SSOService } from './sso.service';

const app = express();
const authService = new AuthService();

app.post('/auth/login', authService.login);
app.post('/auth/register', authService.register);
app.post('/auth/sso/:provider', authService.ssoLogin);
app.get('/auth/verify', authService.verifyToken);
app.post('/auth/refresh', authService.refreshToken);

app.listen(3001);
```

### **2. Workflow Service**
```typescript
// services/workflow/src/index.ts
import express from 'express';
import { WorkflowService } from './workflow.service';
import { ExecutionService } from './execution.service';

const app = express();
const workflowService = new WorkflowService();

app.get('/workflows', workflowService.list);
app.post('/workflows', workflowService.create);
app.get('/workflows/:id', workflowService.get);
app.put('/workflows/:id', workflowService.update);
app.post('/workflows/:id/execute', workflowService.execute);

app.listen(3002);
```

### **3. AI Service**
```typescript
// services/ai/src/index.ts
import express from 'express';
import { AIService } from './ai.service';
import { LangChainService } from './langchain.service';

const app = express();
const aiService = new AIService();

app.post('/ai/generate-workflow', aiService.generateWorkflow);
app.post('/ai/analyze', aiService.analyze);
app.get('/ai/models', aiService.listModels);
app.post('/ai/chat', aiService.chat);

app.listen(3003);
```

---

## 🌐 Service Communication

### **API Gateway Configuration**
```yaml
# kong.yml
services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-routes
        paths: ["/auth"]
        
  - name: workflow-service
    url: http://workflow-service:3002
    routes:
      - name: workflow-routes
        paths: ["/workflows"]
        
  - name: ai-service
    url: http://ai-service:3003
    routes:
      - name: ai-routes
        paths: ["/ai"]

plugins:
  - name: rate-limiting
    service: auth-service
    config:
      minute: 100
      hour: 1000
      
  - name: jwt
    service: auth-service
    config:
      secret_is_base64: false
```

### **Inter-service Communication**
```typescript
// shared/communication/service-client.ts
export class ServiceClient {
  private services = {
    auth: 'http://auth-service:3001',
    workflow: 'http://workflow-service:3002',
    ai: 'http://ai-service:3003',
    reliability: 'http://reliability-service:3004'
  };

  async callService(service: keyof typeof this.services, endpoint: string, data?: any) {
    const response = await fetch(`${this.services[service]}${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': process.env.SERVICE_TOKEN
      },
      body: data ? JSON.stringify(data) : undefined
    });
    
    return response.json();
  }
}
```

---

## 📊 Data Management

### **Database per Service**
```yaml
# docker-compose.microservices.yml
services:
  auth-db:
    image: postgres:15
    environment:
      POSTGRES_DB: corallum_auth
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: ${AUTH_DB_PASSWORD}
    volumes:
      - auth_db_data:/var/lib/postgresql/data
      
  workflow-db:
    image: postgres:15
    environment:
      POSTGRES_DB: corallum_workflow
      POSTGRES_USER: workflow_user
      POSTGRES_PASSWORD: ${WORKFLOW_DB_PASSWORD}
    volumes:
      - workflow_db_data:/var/lib/postgresql/data
      
  ai-db:
    image: postgres:15
    environment:
      POSTGRES_DB: corallum_ai
      POSTGRES_USER: ai_user
      POSTGRES_PASSWORD: ${AI_DB_PASSWORD}
    volumes:
      - ai_db_data:/var/lib/postgresql/data

volumes:
  auth_db_data:
  workflow_db_data:
  ai_db_data:
```

### **Shared Data Layer**
```typescript
// shared/data/shared-repository.ts
export class SharedRepository {
  async getTenantData(tenantId: string): Promise<Tenant> {
    // Call tenant service
    return await this.serviceClient.callService('tenant', `/tenants/${tenantId}`);
  }
  
  async getUserPermissions(userId: string): Promise<Permission[]> {
    // Call auth service
    return await this.serviceClient.callService('auth', `/users/${userId}/permissions`);
  }
}
```

---

## 🔄 Event-Driven Architecture

### **Event Bus Setup**
```typescript
// shared/events/event-bus.ts
import { EventEmitter } from 'events';

export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }
  
  publishEvent(event: DomainEvent) {
    this.emit(event.type, event);
  }
  
  subscribe(eventType: string, handler: EventHandler) {
    this.on(eventType, handler);
  }
  
  private setupEventHandlers() {
    this.on('user.created', this.handleUserCreated);
    this.on('workflow.executed', this.handleWorkflowExecuted);
    this.on('tenant.created', this.handleTenantCreated);
  }
}

export const eventBus = new EventBus();
```

### **Domain Events**
```typescript
// shared/events/domain-events.ts
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  
  constructor(public readonly type: string) {
    this.occurredOn = new Date();
    this.eventId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string
  ) {
    super('user.created');
  }
}

export class WorkflowExecutedEvent extends DomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly executionId: string,
    public readonly status: string
  ) {
    super('workflow.executed');
  }
}
```

---

## 🚀 Deployment Strategy

### **Kubernetes Deployment**
```yaml
# k8s/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: corallum/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - port: 3001
    targetPort: 3001
```

### **Service Mesh (Istio)**
```yaml
# istio/auth-service-vs.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: auth-service
spec:
  hosts:
  - auth-service
  http:
  - match:
    - uri:
        prefix: "/auth"
    route:
    - destination:
        host: auth-service
        port:
          number: 3001
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    retries:
      attempts: 3
      perTryTimeout: 2s
```

---

## 📈 Monitoring & Observability

### **Distributed Tracing**
```typescript
// shared/tracing/tracer.ts
import * as tracing from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'corallum-enterprise',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new JaegerExporter(),
});

sdk.start();

export const tracer = tracing.trace.getTracer('corallum-enterprise');
```

### **Service Metrics**
```typescript
// services/auth/src/metrics.ts
import { Counter, Histogram, register } from 'prom-client';

export const authMetrics = {
  loginAttempts: new Counter({
    name: 'auth_login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['status']
  }),
  
  tokenGeneration: new Histogram({
    name: 'auth_token_generation_duration_seconds',
    help: 'Time taken to generate tokens',
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  
  activeSessions: new Counter({
    name: 'auth_active_sessions_total',
    help: 'Number of active sessions'
  })
};

register.registerMetric(authMetrics.loginAttempts);
register.registerMetric(authMetrics.tokenGeneration);
register.registerMetric(authMetrics.activeSessions);
```

---

## 🎯 Migration Benefits

### **Before (Monolith):**
- ❌ Single point of failure
- ❌ Difficult to scale individual components
- ❌ Technology lock-in
- ❌ Long deployment cycles
- ❌ Tight coupling

### **After (Microservices):**
- ✅ Independent scaling
- ✅ Fault isolation
- ✅ Technology diversity
- ✅ Faster deployments
- ✅ Team autonomy
- ✅ Better resilience
- ✅ Easier testing

---

## 📋 Implementation Checklist

### **Week 1-2: Foundation**
- [ ] Set up API Gateway (Kong)
- [ ] Extract Auth Service
- [ ] Create service discovery
- [ ] Set up monitoring stack

### **Week 3-4: Core Services**
- [ ] Extract Workflow Service
- [ ] Extract AI Service
- [ ] Implement inter-service communication
- [ ] Set up distributed tracing

### **Week 5-6: Advanced Features**
- [ ] Extract Tenant Service
- [ ] Implement event bus
- [ ] Set up service mesh
- [ ] Performance optimization

**Результат: 95/100 Production Ready с микросервисной архитектурой!**
