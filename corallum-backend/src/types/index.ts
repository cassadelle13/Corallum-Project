export interface Node {
  id: string;
  type: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  data: NodeData;
  position: Position;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: EdgeData;
}

export interface NodeData {
  code?: string;
  parameters?: Record<string, any>;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  settings?: Record<string, any>;
  trigger?: boolean;
  action?: string;
  [key: string]: any; // Allow dynamic properties
}

export interface EdgeData {
  label?: string;
  type?: string;
}

export interface NodeInput {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface WorkflowSettings {
  executionOrder?: 'v1' | 'v2';
  timeout?: number;
  retryPolicy?: 'none' | 'linear' | 'exponential';
  maxRetries?: number;
}

export interface IRun {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  triggerData?: any;
  context?: any;
  createdBy?: string;
  nodes: NodeExecution[];
}

export interface NodeExecution {
  id?: string;
  nodeId: string;
  nodeType?: string;
  status: 'running' | 'success' | 'error';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  help?: ErrorHelp;
  timestamp?: Date;
  inputData?: any;
  outputData?: any;
  metadata?: any;
}

export interface ExecutionInsights {
  performance: PerformanceMetrics;
  bottlenecks: string[];
  optimizations: string[];
  duration: number;
  nodeCount: number;
}

export interface PerformanceMetrics {
  totalDuration: number;
  averageNodeDuration: number;
  slowestNode: string;
  fastestNode: string;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ErrorHelp {
  cause: string;
  solution: string;
  alternative: string;
  codeExample?: string;
}

export interface FixSuggestion {
  nodeId: string;
  issue: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
}

export interface RequestAnalysis {
  intent: string;
  services: string[];
  logic: string;
  triggers: string[];
  title: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface ExecutionOptions {
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'medium' | 'high';
  debug?: boolean;
  context?: any;
}

export interface Event {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  workflowId?: string;
  nodeId?: string;
}
