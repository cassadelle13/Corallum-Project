// Windmill-based WebSocket сервис для Corallum
// Real-time обновления в стиле Windmill

import { apiService } from './api';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  workspaceId?: string;
}

export interface JobUpdateMessage extends WebSocketMessage {
  type: 'job_update';
  data: {
    jobId: string;
    status: 'queued' | 'running' | 'success' | 'error' | 'cancelled';
    result?: any;
    error?: string;
    startedAt?: string;
    completedAt?: string;
  };
}

export interface WorkflowUpdateMessage extends WebSocketMessage {
  type: 'workflow_update';
  data: {
    workflowId: string;
    executionId: string;
    status: 'running' | 'success' | 'error' | 'cancelled';
    nodeId?: string;
    nodeStatus?: string;
    result?: any;
  };
}

export interface ResourceUpdateMessage extends WebSocketMessage {
  type: 'resource_update';
  data: {
    resourceId: string;
    action: 'created' | 'updated' | 'deleted';
    resource: any;
  };
}

export interface SystemMessage extends WebSocketMessage {
  type: 'system';
  data: {
    message: string;
    level: 'info' | 'warning' | 'error';
  };
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WindmillWebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private workspaceId: string | null = null;

  constructor() {
    // Не подключаем автоматически - будем подключать только при необходимости
  }

  // Подключение к WebSocket
  async connect(workspaceId?: string): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.workspaceId = workspaceId || null;

    try {
      const wsUrl = apiService.createWebSocket().url.replace(/^http/, 'ws');
      const fullUrl = workspaceId ? `${wsUrl}?workspace=${workspaceId}` : wsUrl;
      
      this.ws = new WebSocket(fullUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Отправляем ping для поддержания соединения
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        // Не пытаемся переподключиться если бэкенд недоступен
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        // При ошибке сразу прекращаем попытки подключения
        this.reconnectAttempts = this.maxReconnectAttempts;
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  // Обработка сообщений
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.subscriptions.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket handler:', error);
        }
      });
    }

    // Общие обработчики для всех сообщений
    const allHandlers = this.subscriptions.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket handler:', error);
        }
      });
    }
  }

  // Подписка на события
  subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    
    this.subscriptions.get(eventType)!.add(handler);

    // Возвращаем функцию для отписки
    return () => {
      const handlers = this.subscriptions.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscriptions.delete(eventType);
        }
      }
    };
  }

  // Отписка от всех событий
  unsubscribeAll(): void {
    this.subscriptions.clear();
  }

  // Отправка сообщения
  send(message: Partial<WebSocketMessage>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type || 'unknown',
        data: message.data || {},
        timestamp: new Date().toISOString(),
        workspaceId: this.workspaceId || undefined,
        ...message
      };
      
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Переподключение
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(this.workspaceId || undefined);
    }, delay);
  }

  // Ping для поддержания соединения
  private startPing(): void {
    const pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', data: { timestamp: Date.now() } });
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping каждые 30 секунд
  }

  // Отключение
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.unsubscribeAll();
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  // Получение статуса соединения
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// Экспорт WebSocket сервиса
export const wsService = new WindmillWebSocketService();
