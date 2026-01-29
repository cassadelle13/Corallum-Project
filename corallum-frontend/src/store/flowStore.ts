import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  executionLogs: ExecutionLog[];
  runs: Run[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (type: string, boilerplate?: string) => void;
  updateNode: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (node: Node | null) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  clearExecutionLogs: () => void;
  addRun: (run: Run) => void;
  getRuns: () => Run[];
  nodeValidations: NodeValidation;
  validateConnection: (sourceId: string, targetId: string, connectionType: string) => Promise<ConnectionValidation>;
  testNodeExecution: (nodeId: string) => Promise<ConnectionValidation>;
  updateNodeValidation: (nodeId: string, validation: Partial<NodeValidation[string]>) => void;
  validateEntireChain: () => Promise<void>;
}

interface ExecutionLog {
  id: string;
  nodeId: string;
  status: 'running' | 'success' | 'error' | 'pending';
  message: string;
  timestamp: number;
}

interface ConnectionValidation {
  isValid: boolean;
  error?: string;
  lastValidated?: number;
  testData?: any;
}

interface NodeValidation {
  [nodeId: string]: {
    inputs: { [key: string]: ConnectionValidation };
    outputs: { [key: string]: ConnectionValidation };
    overall: ConnectionValidation;
  };
}

export interface Run {
  id: string;
  started: number;
  duration: number;
  path: string;
  triggeredBy: string;
  tag?: string;
  status: 'running' | 'success' | 'error' | 'pending';
  kind: 'run' | 'dep';
}

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'default',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Add Module',
      type: 'trigger'
    },
  },
];

// Generate some sample runs for demo
const generateSampleRuns = (): Run[] => {
  const now = Date.now();
  return [
    {
      id: 'run-1',
      started: now - 4 * 60 * 1000,
      duration: 1200,
      path: 'u/admin/test_flow',
      triggeredBy: 'admin',
      status: 'success',
      kind: 'run'
    },
    {
      id: 'run-2',
      started: now - 3 * 60 * 1000,
      duration: 850,
      path: 'u/admin/data_process',
      triggeredBy: 'admin',
      status: 'success',
      kind: 'run'
    },
    {
      id: 'run-3',
      started: now - 2 * 60 * 1000,
      duration: 2100,
      path: 'u/admin/error_handler',
      triggeredBy: 'admin',
      status: 'error',
      kind: 'run'
    },
    {
      id: 'run-4',
      started: now - 1 * 60 * 1000,
      duration: 500,
      path: 'u/admin/quick_task',
      triggeredBy: 'admin',
      status: 'running',
      kind: 'run'
    }
  ];
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: (() => {
    console.log('🔧 Store: initialNodes loaded:', initialNodes);
    return initialNodes;
  })(),
  edges: [],
  selectedNode: null,
  executionLogs: [],
  runs: generateSampleRuns(),
  nodeValidations: {},

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: newEdges });
    
    // Обновляем флаги подключения узлов после изменения рёбер
    const nodes = get().nodes.map(node => {
      const hasInput = newEdges.some(edge => edge.target === node.id);
      const hasOutput = newEdges.some(edge => edge.source === node.id);
      return {
        ...node,
        data: {
          ...node.data,
          isConnected: hasInput || hasOutput,
          hasOutput: hasOutput,
          // НЕ показываем галочку пока нет валидации
          isValidated: false
        }
      };
    });
    set({ nodes });
  },

  onConnect: (connection) => {
    const newEdges = addEdge(connection, get().edges);
    
    // Проверка на дубликаты как в n8n
    const connectionExists = get().edges.some(edge => 
      edge.source === connection.source && 
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
    );
    
    if (connectionExists) {
      return; // Не добавляем дубликат
    }
    
    set({ edges: newEdges });
    
    // Простое обновление статуса подключения как в n8n
    const nodes = get().nodes.map(node => {
      const hasInput = newEdges.some(edge => edge.target === node.id);
      const hasOutput = newEdges.some(edge => edge.source === node.id);
      return {
        ...node,
        data: {
          ...node.data,
          isConnected: hasInput || hasOutput,
          hasOutput: hasOutput
        }
      };
    });
    set({ nodes });
  },

  // 🆕 НОВАЯ ФУНКЦИЯ - ВАЛИДАЦИЯ ВСЕЙ ЦЕПОЧКИ
  validateEntireChain: async () => {
    const { nodes, edges, validateConnection, updateNodeValidation } = get();
    
    // Находим все связанные узлы
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    // 🚀 СОБИРАЕМ ВСЕ ВАЛИДАЦИИ ОДНОВРЕМЕННО
    const validationPromises = Array.from(connectedNodes).map(async (nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return { nodeId, isValid: false, error: 'Node not found' };

      // Проверяем входящие соединения
      const incomingEdges = edges.filter(e => e.target === nodeId);
      let isValid = true;
      let errors: string[] = [];

      // Валидируем все входящие соединения одновременно
      const edgeValidations = await Promise.all(
        incomingEdges.map(edge => 
          validateConnection(edge.source, edge.target, edge.sourceHandle || 'main')
        )
      );

      edgeValidations.forEach(validation => {
        if (!validation.isValid) {
          isValid = false;
          if (validation.error) errors.push(validation.error);
        }
      });

      return {
        nodeId,
        isValid,
        error: errors.join('; ') || undefined,
        incomingEdges
      };
    });

    // ⏳ ЖДЕМ ВСЕ ВАЛИДАЦИИ ОДНОВРЕМЕННО
    const allValidations = await Promise.all(validationPromises);

    // 🎯 ОБНОВЛЯЕМ UI ОДИН РАЗ ДЛЯ ВСЕХ УЗЛОВ
    const updatedNodes = nodes.map(node => {
      const validation = allValidations.find(v => v.nodeId === node.id);
      if (!validation) return node;

      // Обновляем валидацию узла
      updateNodeValidation(node.id, {
        overall: {
          isValid: validation.isValid,
          error: validation.error,
          lastValidated: Date.now()
        },
        inputs: (validation.incomingEdges || []).reduce((acc, edge) => ({
          ...acc,
          [edge.targetHandle || 'main']: {
            isValid: validation.isValid,
            error: validation.error,
            lastValidated: Date.now()
          }
        }), {})
      });

      // Возвращаем обновленный узел
      return {
        ...node,
        data: {
          ...node.data,
          isValidated: validation.isValid
        }
      };
    });

    // 🚀 ОДНО ОБНОВЛЕНИЕ ДЛЯ ВСЕЙ ЦЕПОЧКИ
    set({ nodes: updatedNodes });
  },

  validateConnection: async (sourceId: string, targetId: string, connectionType: string): Promise<ConnectionValidation> => {
    // Имитация валидации как в n8n
    try {
      const sourceNode = get().nodes.find(n => n.id === sourceId);
      const targetNode = get().nodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) {
        return { isValid: false, error: 'Nodes not found' };
      }

      // Проверка совместимости типов
      const sourceType = sourceNode.data.type as string;
      const targetType = targetNode.data.type as string;
      
      // Базовая логика валидации
      const incompatiblePairs = [
        ['trigger', 'trigger'],
        ['webhook', 'webhook'],
        ['schedule', 'schedule']
      ];
      
      const isIncompatible = incompatiblePairs.some(pair => 
        pair.includes(sourceType) && pair.includes(targetType)
      );

      if (isIncompatible) {
        return { isValid: false, error: `Cannot connect ${sourceType} to ${targetType}` };
      }

      // Имитация тестового выполнения
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        isValid: true,
        lastValidated: Date.now(),
        testData: { sourceType, targetType, connectionType }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, error: errorMessage };
    }
  },

  testNodeExecution: async (nodeId: string): Promise<ConnectionValidation> => {
    // Имитация тестового выполнения узла
    try {
      const node = get().nodes.find(n => n.id === nodeId);
      if (!node) {
        return { isValid: false, error: 'Node not found' };
      }

      // Имитация выполнения
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        isValid: true,
        lastValidated: Date.now(),
        testData: { nodeId, executionResult: 'success' }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, error: errorMessage };
    }
  },

  updateNodeValidation: (nodeId: string, validation: Partial<NodeValidation[string]>) => {
    set({
      nodeValidations: {
        ...get().nodeValidations,
        [nodeId]: {
          ...get().nodeValidations[nodeId],
          ...validation
        }
      }
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (type: string, boilerplate?: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        type: type, // Сохраняем тип узла
        label: `New ${type}`, 
        code: boilerplate || '', 
        language: type === 'database' ? 'sql' : 'python',
        inputs: [],
        outputs: [{ id: 'output', label: 'Output', type: 'any' }],
        isConnected: false,
        hasOutput: false,
        isValidated: false // Новое поле для реальной валидации
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNode: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  addExecutionLog: (log) => {
    set({ executionLogs: [...get().executionLogs, log] });
  },

  clearExecutionLogs: () => {
    set({ executionLogs: [] });
  },

  addRun: (run) => {
    set({ runs: [...get().runs, run] });
  },

  getRuns: () => {
    return get().runs;
  },
}));
