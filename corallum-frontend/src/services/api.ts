// Windmill-based API клиент для Corallum
// Вдохновлен архитектурой Windmill frontend
// Работает через Vite прокси как в Windmill

const API_BASE_URL = ''; // Используем прокси Vite
const WS_BASE_URL = ''; // Используем прокси Vite

// Интерфейсы на основе Windmill API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface NodeTypeDefinition {
  type: string;
  displayName: string;
  description: string;
  icon: string;
  category: 'triggers' | 'operators' | 'integrations' | 'resources' | 'aiagents';
  color?: string;
  shape?: 'square' | 'rectangle' | 'diamond' | 'circle';
  boilerplate?: string;
  inputs?: any[];
  outputs?: any[];
  parameters?: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  triggerData?: any;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  nodes: any[];
}

export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'error' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  workspaceId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  isSuperAdmin: boolean;
  workspaceId: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  workspaceSettings: any;
}

class WindmillApiClient {
  private baseUrl: string;
  private wsUrl: string;

  constructor(baseUrl?: string, wsUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
    this.wsUrl = wsUrl || WS_BASE_URL;
  }

  // Базовый HTTP запрос (Windmill style)
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Если нельзя распарсить JSON, используем текст ошибки
        const text = await response.text();
        throw new Error(`Server error: ${response.status} - ${text || response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: data.data || data,
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============= WORKSPACE METHODS =============
  
  async getWorkspace(): Promise<Workspace> {
    const response = await this.get<Workspace>('/api/workspace');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get workspace');
  }

  async updateWorkspaceSettings(settings: any): Promise<void> {
    const response = await this.post('/api/workspace/settings', settings);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update workspace settings');
    }
  }

  // ============= USER METHODS =============
  
  async getCurrentUser(): Promise<User> {
    const response = await this.get<User>('/api/user/me');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get current user');
  }

  async getUsers(): Promise<User[]> {
    const response = await this.get<User[]>('/api/users');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get users');
  }

  // ============= NODE TYPES METHODS =============
  
  async getNodeTypes(): Promise<NodeTypeDefinition[]> {
    const response = await this.get<any>('/api/nodes/types');
    if (response.success && response.data) {
      return response.data.types || [];
    }
    throw new Error(response.error || 'Failed to fetch node types');
  }

  async executeNode(nodeType: string, parameters: Record<string, any>): Promise<any> {
    const response = await this.post<any>(`/api/nodes/${nodeType}/execute`, { parameters });
    if (response.success && response.data) {
      return response.data.result;
    }
    throw new Error(response.error || 'Failed to execute node');
  }

  // ============= WORKFLOW METHODS =============
  
  async createWorkflow(workflowData: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const response = await this.post<WorkflowDefinition>('/api/workflows', workflowData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create workflow');
  }

  async getWorkflow(workflowId: string): Promise<WorkflowDefinition> {
    const response = await this.get<WorkflowDefinition>(`/api/workflows/${workflowId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get workflow');
  }

  async updateWorkflow(workflowId: string, workflowData: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const response = await this.put<WorkflowDefinition>(`/api/workflows/${workflowId}`, workflowData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update workflow');
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const response = await this.delete(`/api/workflows/${workflowId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete workflow');
    }
  }

  async listWorkflows(): Promise<WorkflowDefinition[]> {
    const response = await this.get<WorkflowDefinition[]>('/api/workflows');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list workflows');
  }

  async executeWorkflow(workflowId: string, triggerData: any = {}): Promise<WorkflowExecution> {
    const response = await this.post<WorkflowExecution>(`/api/workflows/${workflowId}/execute`, triggerData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to execute workflow');
  }

  // ============= EXECUTION METHODS =============
  
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const response = await this.get<WorkflowExecution>(`/api/executions/${executionId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get execution');
  }

  async listExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    const url = workflowId ? `/api/executions?workflowId=${workflowId}` : '/api/executions';
    const response = await this.get<WorkflowExecution[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list executions');
  }

  async cancelExecution(executionId: string): Promise<void> {
    const response = await this.post(`/api/executions/${executionId}/cancel`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to cancel execution');
    }
  }

  // ============= RESOURCE METHODS =============
  
  async listResources(): Promise<any[]> {
    const response = await this.get<any[]>('/api/resources');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list resources');
  }

  async createResource(resourceData: any): Promise<any> {
    const response = await this.post<any>('/api/resources', resourceData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create resource');
  }

  // ============= SCHEDULE METHODS =============
  
  async listSchedules(): Promise<any[]> {
    const response = await this.get<any[]>('/api/schedules');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list schedules');
  }

  async createSchedule(scheduleData: any): Promise<any> {
    const response = await this.post<any>('/api/schedules', scheduleData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create schedule');
  }

  // ============= HEALTH & SYSTEM =============
  
  async healthCheck(): Promise<{ status: string; version: string; timestamp: string }> {
    const response = await this.get<any>('/api/health');
    if (response.success && response.data) {
      return {
        status: response.data.status,
        version: response.data.version,
        timestamp: response.data.timestamp
      };
    }
    throw new Error(response.error || 'Health check failed');
  }

  // ============= WEBHOOK METHODS =============
  
  async createWebhook(webhookData: any): Promise<any> {
    const response = await this.post<any>('/api/webhooks', webhookData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create webhook');
  }

  async listWebhooks(): Promise<any[]> {
    const response = await this.get<any[]>('/api/webhooks');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to list webhooks');
  }

  // ============= HELPER METHODS =============
  
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // WebSocket connection для real-time обновлений
  createWebSocket(path: string = '/ws'): WebSocket {
    return new WebSocket(`${this.wsUrl}${path}`);
  }
}

// Экспорт API клиента
export const apiService = new WindmillApiClient();

// ============= JARILO AI INTEGRATION SERVICE =============

export interface JariloTaskRequest {
  task_description: string;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
}

export interface JariloTaskResponse {
  task_id: string;
  status: 'created' | 'planning' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  events?: JariloEvent[];
}

export interface JariloEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface JariloWorkflowRequest {
  description: string;
  requirements?: string[];
  constraints?: Record<string, any>;
  integrations?: string[];
}

export interface JariloWorkflowResponse {
  workflow: any;
  analysis: any;
  optimizations: any;
}

export interface JariloNodeCatalogEntry {
  type: string;
  kind: 'trigger' | 'tool';
  supported: boolean;
  tool?: string;
  actions?: string[];
  schema?: any;
}

export interface JariloNodeCatalogResponse {
  nodes: JariloNodeCatalogEntry[];
  total: number;
  error?: string;
}

export class JariloAIService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    // Jarilo проксируется через Vite dev-server: /jarilo -> http://localhost:8000
    this.baseUrl = '/jarilo';
    this.wsUrl = '';
  }

  private extractError(payload: any): string | undefined {
    if (!payload) return undefined;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
    if (Array.isArray(payload.result) && payload.result.length > 0) {
      const first = payload.result[0];
      if (typeof first === 'string' && first.trim()) return first;
    }
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    return undefined;
  }

  async getNodeCatalog(): Promise<JariloNodeCatalogResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/catalog/nodes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch node catalog: ${response.status}`);
    }

    return await response.json();
  }

  private tryParseJson(text: string): any {
    const trimmed = text.trim();
    if (!trimmed) return undefined;

    // Strip markdown code fences
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidateText = fenceMatch ? fenceMatch[1].trim() : trimmed;

    // First try direct parse
    try {
      return JSON.parse(candidateText);
    } catch {
      // Try extracting the first JSON object/array substring
      const firstObj = candidateText.indexOf('{');
      const firstArr = candidateText.indexOf('[');
      const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
      if (start === -1) return undefined;

      const endObj = candidateText.lastIndexOf('}');
      const endArr = candidateText.lastIndexOf(']');
      const end = Math.max(endObj, endArr);
      if (end <= start) return undefined;

      const sliced = candidateText.slice(start, end + 1);
      try {
        return JSON.parse(sliced);
      } catch {
        return undefined;
      }
    }
  }

  private extractWorkflow(payloadResult: any): any {
    if (payloadResult == null) return undefined;

    // Jarilo sometimes returns arrays of strings
    if (Array.isArray(payloadResult)) {
      const joined = payloadResult
        .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
        .join('\n');
      return this.extractWorkflow(joined);
    }

    if (typeof payloadResult === 'string') {
      const parsed = this.tryParseJson(payloadResult);
      if (parsed !== undefined) return this.extractWorkflow(parsed);
      return undefined;
    }

    if (typeof payloadResult === 'object') {
      // Common shapes
      if (payloadResult.nodes && payloadResult.edges) return payloadResult;
      if (payloadResult.workflow && payloadResult.workflow.nodes && payloadResult.workflow.edges) return payloadResult.workflow;
      if (payloadResult.graph && payloadResult.graph.nodes && payloadResult.graph.edges) return payloadResult.graph;
      return payloadResult;
    }

    return undefined;
  }

  // ============= TASK MANAGEMENT =============
  
  async createTask(request: JariloTaskRequest): Promise<JariloTaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ prompt: request.task_description }),
      });

      if (!response.ok) {
        throw new Error(`Jarilo API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        task_id: data.id,
        status: (data.status as JariloTaskResponse['status']) || 'created',
        result: data.result,
        error: this.extractError(data),
      };
    } catch (error) {
      console.error('Jarilo task creation failed:', error);
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<JariloTaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`);
      
      if (!response.ok) {
        throw new Error(`Jarilo API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        task_id: taskId,
        status: data.status,
        result: data.result,
        error: this.extractError(data),
      };
    } catch (error) {
      console.error('Jarilo task status check failed:', error);
      throw error;
    }
  }

  // ============= WORKFLOW GENERATION =============
  
  async generateWorkflow(request: JariloWorkflowRequest): Promise<JariloWorkflowResponse> {
    const catalog = await this.getNodeCatalog();
    const supportedNodes = (catalog.nodes || []).filter((n) => n.supported);
    const supportedTypes = supportedNodes.map((n) => n.type);

    if (supportedTypes.length === 0) {
      throw new Error('Node catalog is empty: backend returned no supported node types');
    }

    const catalogForPrompt = supportedNodes.map((n) => ({
      type: n.type,
      kind: n.kind,
      tool: n.tool,
      actions: n.actions,
      schema: n.schema,
    }));

    const taskDescription = `
    Создай workflow для Corallum (React Flow) на основе требований.

    ВАЖНО:
    - Используй ТОЛЬКО поддерживаемые типы node.data.type.
    - Каждый node должен иметь data.type из allowlist.
    - Каждый node должен содержать data.label.
    - Должен быть минимум один trigger: trigger/webhook/schedule/manual.
    - Не создавай циклы.
    - Верни ТОЛЬКО JSON (без markdown), строго в формате {"nodes": [...], "edges": [...]}

    Описание: ${request.description}
    Требования: ${request.requirements?.join(', ') || 'Нет'}
    Интеграции: ${request.integrations?.join(', ') || 'Базовые'}
    Ограничения: ${JSON.stringify(request.constraints || {})}

    Allowlist типов и схемы (NodeCatalog):
    ${JSON.stringify(catalogForPrompt)}
    `;

    let retryCount = 0;
    const maxRetries = 3;

    const maxRepairAttempts = 2;

    while (retryCount < maxRetries) {
      try {
        const result = await this.createTask({
          task_description: taskDescription,
          priority: 'high',
          timeout: 60000,
        });

        // Ожидаем завершения задачи с таймаутом
        let finalResult = result;
        let attempts = 0;
        const maxAttempts = 60; // 60 секунд максимум

        while (finalResult.status !== 'completed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            finalResult = await this.getTaskStatus(result.task_id);
          } catch (statusError) {
            console.warn('Status check failed, retrying...', statusError);
            continue;
          }
          
          attempts++;
          
          // Если задача завершилась с ошибкой, пробуем еще раз
          if (finalResult.status === 'failed') {
            const candidate = this.extractWorkflow(finalResult.result);
            if (candidate && Array.isArray(candidate.nodes) && candidate.nodes.length > 0 && Array.isArray(candidate.edges)) {
              return {
                workflow: candidate,
                analysis: { generated_by: 'jarilo', confidence: 0.85 },
                optimizations: { suggested_improvements: [] },
              };
            }

            throw new Error(`Jarilo task failed: ${finalResult.error || 'Unknown error'}`);
          }
        }

        if (finalResult.status !== 'completed') {
          throw new Error(`Jarilo workflow generation timeout after ${maxAttempts} seconds`);
        }

        let workflow = this.extractWorkflow(finalResult.result);
        if (!workflow || !Array.isArray((workflow as any).nodes) || !Array.isArray((workflow as any).edges)) {
          const details = finalResult.error || this.extractError({ result: finalResult.result }) || 'Unknown error';
          throw new Error(`Failed to parse Jarilo workflow result: ${details}`);
        }

        // Hard guard: fail fast if LLM used unsupported types
        const unsupported = (workflow.nodes || [])
          .map((n: any) => ({ id: n?.id, type: n?.data?.type }))
          .filter((x: any) => !x.type || !supportedTypes.includes(x.type));
        if (unsupported.length > 0) {
          throw new Error(
            `Workflow contains unsupported node.data.type: ${unsupported.map((x: any) => `${x.id}:${x.type}`).join(', ')}. ` +
              `Supported: ${supportedTypes.join(', ')}`
          );
        }

        // validate→repair loop
        for (let repairAttempt = 0; repairAttempt <= maxRepairAttempts; repairAttempt++) {
          const validation = await this.validateWorkflow(workflow);
          if (validation?.is_valid) {
            return {
              workflow,
              analysis: { generated_by: 'jarilo', confidence: 0.85, validation },
              optimizations: { suggested_improvements: validation?.suggestions || [] },
            };
          }

          if (repairAttempt === maxRepairAttempts) {
            throw new Error(
              `Generated workflow is not valid after repairs. Errors: ${(validation?.errors || []).join('; ')}`
            );
          }

          const repairPrompt = `
          Исправь workflow JSON так, чтобы он стал валидным для Corallum и исполнимым в Jarilo.

          ВАЖНО:
          - Верни ТОЛЬКО JSON (без markdown), строго {"nodes": [...], "edges": [...]}
          - Используй только node.data.type из allowlist.
          - Не создавай циклы.

          Allowlist типов и схемы (NodeCatalog):
          ${JSON.stringify(catalogForPrompt)}

          Ошибки валидации:
          ${JSON.stringify(validation)}

          Текущий workflow:
          ${JSON.stringify(workflow)}
          `;

          const repairTask = await this.createTask({
            task_description: repairPrompt,
            priority: 'high',
            timeout: 60000,
          });

          let repairResult = repairTask;
          let repairPolls = 0;
          const repairMaxPolls = 60;
          while (repairResult.status !== 'completed' && repairPolls < repairMaxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            repairResult = await this.getTaskStatus(repairTask.task_id);
            repairPolls++;
            if (repairResult.status === 'failed') break;
          }

          const repairedWorkflow = this.extractWorkflow(repairResult.result);
          if (repairedWorkflow && Array.isArray(repairedWorkflow.nodes) && Array.isArray(repairedWorkflow.edges)) {
            workflow = repairedWorkflow;
            continue;
          }

          throw new Error(`Repair attempt failed: ${repairResult.error || 'Unknown error'}`);
        }

        throw new Error('Unreachable: validate/repair loop ended unexpectedly');
        
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Jarilo workflow generation failed after retries:', error);
          throw new Error(`Jarilo workflow generation failed after ${maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        console.warn(`Retry ${retryCount}/${maxRetries} for workflow generation...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Экспоненциальный бэкоф
      }
    }
    
    throw new Error(`Jarilo workflow generation failed after ${maxRetries} retries`);
  }

  // 🚀 НОВЫЙ: STREAMING WORKFLOW GENERATION
  async generateWorkflowStream(request: JariloWorkflowRequest, onEvent: (event: any) => void): Promise<EventSource> {
    const taskDescription = `
    Создай workflow для Corallum на основе требований:
    
    Описание: ${request.description}
    Требования: ${request.requirements?.join(', ') || 'Нет'}
    Интеграции: ${request.integrations?.join(', ') || 'Базовые'}
    Ограничения: ${JSON.stringify(request.constraints || {})}
    
    Верни результат в формате JSON с nodes и edges для React Flow.
    `;

    try {
      // Создаем задачу
      const createResponse = await fetch(`${this.baseUrl}/api/v1/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ prompt: taskDescription }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create task: ${createResponse.status}`);
      }

      const taskData = await createResponse.json();
      const taskId = taskData.id;

      // Подключаемся к streaming endpoint
      const eventSource = new EventSource(`${this.baseUrl}/api/v1/tasks/${taskId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
        } catch (error) {
          console.error('Failed to parse SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        onEvent({ event_type: 'ERROR', data: { error: 'Streaming connection failed' } });
      };

      return eventSource;
    } catch (error) {
      console.error('Streaming workflow generation failed:', error);
      throw error;
    }
  }

  // 🚀 НОВЫЙ: GET AVAILABLE TOOLS
  async getAvailableTools(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tools/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get tools: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get available tools:', error);
      throw error;
    }
  }

  // 🚀 НОВЫЙ: VALIDATE WORKFLOW
  async validateWorkflow(workflow: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate workflow: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to validate workflow:', error);
      throw error;
    }
  }

  // ============= WORKFLOW ANALYSIS =============
  
  async analyzeWorkflow(workflow: any): Promise<any> {
    const analysisRequest = `
    Проанализируй workflow Corallum и дай рекомендации:
    
    Workflow: ${JSON.stringify(workflow, null, 2)}
    
    Проверь:
    1. Оптимизация узлов
    2. Параллельное выполнение
    3. Возможные ошибки
    4. Улучшения производительности
    
    Верни JSON с анализом и рекомендациями.
    `;

    try {
      const result = await this.createTask({
        task_description: analysisRequest,
        priority: 'medium',
        timeout: 30000,
      });

      // Ожидаем завершения
      let finalResult = result;
      let attempts = 0;
      const maxAttempts = 15;

      while (finalResult.status !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalResult = await this.getTaskStatus(result.task_id);
        attempts++;
      }

      if (finalResult.status !== 'completed') {
        throw new Error('Jarilo workflow analysis timeout');
      }

      return finalResult.result;
    } catch (error) {
      console.error('Jarilo workflow analysis failed:', error);
      throw error;
    }

  }

  // ============= REAL-TIME MONITORING =============
  
  createTaskWebSocket(_taskId: string): WebSocket {
    throw new Error('Jarilo streaming uses SSE (EventSource). WebSocket is not supported for /api/v1/tasks/{taskId}/stream.');
  }
  // ============= HEALTH CHECK =============
  
  async healthCheck(): Promise<boolean> {
    try {
      // Используем рабочий эндпоинт для проверки доступности
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/`, {
        method: 'GET',
      });
      
      // Если эндпоинт существует (даже если метод не разрешен), сервис работает
      return response.status !== 0;
    } catch (error) {
      console.error('Jarilo health check failed:', error);
      return false;
    }
  }
}

// Экспорт Jarilo AI сервиса
export const jariloService = new JariloAIService();
