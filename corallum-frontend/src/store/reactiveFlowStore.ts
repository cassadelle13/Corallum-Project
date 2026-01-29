import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';

// 🎯 НОВЫЕ ИНТЕРФЕЙСЫ ДЛЯ РЕАКТИВНОСТИ
interface ReactiveFlowState {
  // Основные данные
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  
  // История для Undo/Redo
  history: {
    nodes: Node[][];
    edges: Edge[][];
    currentIndex: number;
  };
  
  // Оптимизация: виртуализация
  viewportNodes: Node[];
  visibleArea: { x1: number; y1: number; x2: number; y2: number };
  
  // Производительность: кэширование
  nodeCache: Map<string, Node>;
  edgeCache: Map<string, Edge>;
  
  // Метрики производительности
  performance: {
    lastRenderTime: number;
    totalNodes: number;
    visibleNodes: number;
    renderCount: number;
  };
  
  // Основные методы
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // 🚀 УЛУЧШЕННЫЕ МЕТОДЫ
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (type: string, boilerplate?: string) => void;
  updateNode: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (node: Node | null) => void;
  
  // 🎯 НОВЫЕ ФУНКЦИИ
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  updateViewport: (area: { x1: number; y1: number; x2: number; y2: number }) => void;
  getPerformanceMetrics: () => any;
  
  // Автосохранение
  autoSave: () => void;
  loadFromStorage: () => boolean;
}

interface ExecutionLog {
  id: string;
  nodeId: string;
  status: 'running' | 'success' | 'error' | 'pending';
  message: string;
  timestamp: number;
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

// 🚀 УТИЛИТЫ ДЛЯ ОПТИМИЗАЦИИ
class PerformanceMonitor {
  private startTime: number = 0;
  
  startRender() {
    this.startTime = performance.now();
  }
  
  endRender() {
    return performance.now() - this.startTime;
  }
}

// 🔧 УТИЛИТЫ ДЛЯ ВИРТУАЛИЗАЦИИ
const isNodeInViewport = (node: Node, viewport: { x1: number; y1: number; x2: number; y2: number }) => {
  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const nodeWidth = (node as any).measured?.width || 200;
  const nodeHeight = (node as any).measured?.height || 100;
  
  return (
    nodeX + nodeWidth >= viewport.x1 &&
    nodeX <= viewport.x2 &&
    nodeY + nodeHeight >= viewport.y1 &&
    nodeY <= viewport.y2
  );
};

// 🎯 ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В КОМПОНЕНТАХ
export const useReactiveFlowStore = create<ReactiveFlowState>()(
  subscribeWithSelector((set, get) => {
    const performanceMonitor = new PerformanceMonitor();
    
    return {
      // Начальное состояние
      nodes: [],
      edges: [],
      selectedNode: null,
      
      // История для Undo/Redo
      history: {
        nodes: [[]],
        edges: [[]],
        currentIndex: 0
      },
      
      // Виртуализация
      viewportNodes: [],
      visibleArea: { x1: 0, y1: 0, x2: 1000, y2: 1000 },
      
      // Кэширование
      nodeCache: new Map(),
      edgeCache: new Map(),
      
      // Метрики
      performance: {
        lastRenderTime: 0,
        totalNodes: 0,
        visibleNodes: 0,
        renderCount: 0
      },
      
      // 🚀 ОПТИМИЗИРОВАННЫЕ МЕТОДЫ
      onNodesChange: (changes: NodeChange[]) => {
        performanceMonitor.startRender();
        
        const nodes = applyNodeChanges(changes, get().nodes);
        
        // Обновляем кэш
        const nodeCache = new Map(get().nodeCache);
        changes.forEach(change => {
          if (change.type === 'remove' && change.id) {
            nodeCache.delete(change.id);
          }
        });
        
        set({ 
          nodes,
          nodeCache,
          performance: {
            ...get().performance,
            lastRenderTime: performanceMonitor.endRender(),
            totalNodes: nodes.length,
            renderCount: get().performance.renderCount + 1
          }
        });
        
        // Автосохранение
        get().autoSave();
      },
      
      onEdgesChange: (changes: EdgeChange[]) => {
        performanceMonitor.startRender();
        
        const edges = applyEdgeChanges(changes, get().edges);
        
        // Обновляем кэш
        const edgeCache = new Map(get().edgeCache);
        changes.forEach(change => {
          if (change.type === 'remove' && change.id) {
            edgeCache.delete(change.id);
          }
        });
        
        set({ 
          edges,
          edgeCache,
          performance: {
            ...get().performance,
            lastRenderTime: performanceMonitor.endRender(),
            renderCount: get().performance.renderCount + 1
          }
        });
        
        get().autoSave();
      },
      
      onConnect: (connection: Connection) => {
        performanceMonitor.startRender();
        
        const edges = addEdge(connection, get().edges);
        
        set({ 
          edges,
          performance: {
            ...get().performance,
            lastRenderTime: performanceMonitor.endRender(),
            renderCount: get().performance.renderCount + 1
          }
        });
        
        get().autoSave();
      },
      
      // 🎯 УЛУЧШЕННЫЙ setNodes - БЕЗ СОЗДАНИЯ НОВОГО МАССИВА
      setNodes: (nodes: Node[]) => {
        performanceMonitor.startRender();
        
        // Обновляем кэш только для новых/измененных узлов
        const nodeCache = new Map(get().nodeCache);
        nodes.forEach(node => {
          if (!nodeCache.has(node.id) || JSON.stringify(nodeCache.get(node.id)) !== JSON.stringify(node)) {
            nodeCache.set(node.id, node);
          }
        });
        
        set({ 
          nodes,
          nodeCache,
          performance: {
            ...get().performance,
            lastRenderTime: performanceMonitor.endRender(),
            totalNodes: nodes.length,
            renderCount: get().performance.renderCount + 1
          }
        });
      },
      
      setEdges: (edges: Edge[]) => {
        performanceMonitor.startRender();
        
        // Обновляем кэш
        const edgeCache = new Map(get().edgeCache);
        edges.forEach(edge => {
          if (!edgeCache.has(edge.id) || JSON.stringify(edgeCache.get(edge.id)) !== JSON.stringify(edge)) {
            edgeCache.set(edge.id, edge);
          }
        });
        
        set({ 
          edges,
          edgeCache,
          performance: {
            ...get().performance,
            lastRenderTime: performanceMonitor.endRender(),
            renderCount: get().performance.renderCount + 1
          }
        });
      },
      
      // 🚀 УЛУЧШЕННЫЙ addNode - ОПТИМИЗИРОВАННЫЙ
      addNode: (type: string, boilerplate?: string) => {
        performanceMonitor.startRender();
        
        const currentState = get();
        const nodes = [...currentState.nodes];
        const filteredNodes = nodes.filter(node => node.id !== 'placeholder');
        
        // Умное позиционирование
        let nextX = 400;
        let nextY = 250;
        
        if (filteredNodes.length > 0) {
          const lastNode = filteredNodes[filteredNodes.length - 1];
          const nodeWidth = (lastNode as any).measured?.width || 200;
          nextX = lastNode.position.x + nodeWidth + 50;
          nextY = lastNode.position.y;
        }
        
        const newNode: Node = {
          id: `${type}-${Date.now()}`,
          type: 'default',
          data: { 
            type: type, 
            label: type === 'aiagent' ? 'AI Agent' : `New ${type}`, 
            code: boilerplate || '', 
            language: type === 'database' ? 'sql' : 'python',
            inputs: [],
            outputs: [{ id: 'output', label: 'Output', type: 'any' }],
            isConnected: false,
            hasOutput: false,
            subtitle: type === 'aiagent' ? 'Tools Agent' : undefined,
            chatModel: type === 'aiagent' ? false : undefined,
            memory: type === 'aiagent' ? false : undefined,
            tool: type === 'aiagent' ? false : undefined
          },
          position: { x: nextX, y: nextY },
        };
        
        // 🎯 ТОЛЬКО ОДИН PUSH - БЕЗ СОЗДАНИЯ НОВОГО МАССИВА
        filteredNodes.push(newNode);
        
        // Обновляем кэш
        const nodeCache = new Map(currentState.nodeCache);
        nodeCache.set(newNode.id, newNode);
        
        // Сохраняем в историю
        const newHistory = {
          nodes: [...currentState.history.nodes.slice(0, currentState.history.currentIndex + 1), filteredNodes],
          edges: [...currentState.history.edges.slice(0, currentState.history.currentIndex + 1), currentState.edges],
          currentIndex: currentState.history.currentIndex + 1
        };
        
        set({ 
          nodes: filteredNodes,
          nodeCache,
          history: newHistory,
          performance: {
            ...currentState.performance,
            lastRenderTime: performanceMonitor.endRender(),
            totalNodes: filteredNodes.length,
            renderCount: currentState.performance.renderCount + 1
          }
        });
        
        // Автосохранение
        get().autoSave();
        
        console.log(`✅ Узел ${type} добавлен за ${performanceMonitor.endRender().toFixed(2)}ms`);
      },
      
      updateNode: (id: string, data: any) => {
        performanceMonitor.startRender();
        
        const currentState = get();
        const nodes = currentState.nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...data } } : node
        );
        
        // Обновляем кэш
        const nodeCache = new Map(currentState.nodeCache);
        const updatedNode = nodes.find(n => n.id === id);
        if (updatedNode) {
          nodeCache.set(id, updatedNode);
        }
        
        set({ 
          nodes,
          nodeCache,
          performance: {
            ...currentState.performance,
            lastRenderTime: performanceMonitor.endRender(),
            renderCount: currentState.performance.renderCount + 1
          }
        });
        
        get().autoSave();
      },
      
      deleteNode: (id: string) => {
        performanceMonitor.startRender();
        
        const currentState = get();
        const nodes = currentState.nodes.filter((node) => node.id !== id);
        const edges = currentState.edges.filter((edge) => edge.source !== id && edge.target !== id);
        
        // Обновляем кэш
        const nodeCache = new Map(currentState.nodeCache);
        const edgeCache = new Map(currentState.edgeCache);
        nodeCache.delete(id);
        
        set({ 
          nodes,
          edges,
          nodeCache,
          edgeCache,
          performance: {
            ...currentState.performance,
            lastRenderTime: performanceMonitor.endRender(),
            totalNodes: nodes.length,
            renderCount: currentState.performance.renderCount + 1
          }
        });
        
        get().autoSave();
      },
      
      setSelectedNode: (node: Node | null) => set({ selectedNode: node }),
      
      // 🎯 НОВЫЕ ФУНКЦИИ
      undo: () => {
        const currentState = get();
        if (currentState.history.currentIndex > 0) {
          const newIndex = currentState.history.currentIndex - 1;
          set({
            nodes: currentState.history.nodes[newIndex],
            edges: currentState.history.edges[newIndex],
            history: { ...currentState.history, currentIndex: newIndex }
          });
        }
      },
      
      redo: () => {
        const currentState = get();
        if (currentState.history.currentIndex < currentState.history.nodes.length - 1) {
          const newIndex = currentState.history.currentIndex + 1;
          set({
            nodes: currentState.history.nodes[newIndex],
            edges: currentState.history.edges[newIndex],
            history: { ...currentState.history, currentIndex: newIndex }
          });
        }
      },
      
      clearHistory: () => {
        const currentState = get();
        set({
          history: {
            nodes: [currentState.nodes],
            edges: [currentState.edges],
            currentIndex: 0
          }
        });
      },
      
      updateViewport: (area: { x1: number; y1: number; x2: number; y2: number }) => {
        const currentState = get();
        const viewportNodes = currentState.nodes.filter(node => 
          isNodeInViewport(node, area)
        );
        
        set({
          visibleArea: area,
          viewportNodes,
          performance: {
            ...currentState.performance,
            visibleNodes: viewportNodes.length
          }
        });
      },
      
      getPerformanceMetrics: () => {
        const currentState = get();
        return {
          ...currentState.performance,
          cacheSize: {
            nodes: currentState.nodeCache.size,
            edges: currentState.edgeCache.size
          },
          historySize: currentState.history.currentIndex + 1
        };
      },
      
      // Автосохранение в localStorage
      autoSave: () => {
        try {
          const currentState = get();
          const saveData = {
            nodes: currentState.nodes,
            edges: currentState.edges,
            timestamp: Date.now()
          };
          localStorage.setItem('reactive-flow-autosave', JSON.stringify(saveData));
        } catch (error) {
          console.warn('❌ Автосохранение не удалось:', error);
        }
      },
      
      loadFromStorage: () => {
        try {
          const savedData = localStorage.getItem('reactive-flow-autosave');
          if (savedData) {
            const data = JSON.parse(savedData);
            set({
              nodes: data.nodes || [],
              edges: data.edges || []
            });
            console.log('✅ Workflow загружен из автосохранения');
            return true;
          }
        } catch (error) {
          console.warn('❌ Загрузка из автосохранения не удалась:', error);
        }
        return false;
      }
    };
  })
);

// 🎯 HOOK ДЛЯ УДОБНОГО ИСПОЛЬЗОВАНИЯ
export const useReactiveFlow = () => {
  const store = useReactiveFlowStore();
  
  return {
    // Основные данные
    nodes: store.nodes,
    edges: store.edges,
    selectedNode: store.selectedNode,
    
    // Оптимизированные узлы для рендеринга
    viewportNodes: store.viewportNodes,
    
    // Метрики
    performance: store.performance,
    
    // История
    history: store.history,
    
    // Методы
    onNodesChange: store.onNodesChange,
    onEdgesChange: store.onEdgesChange,
    onConnect: store.onConnect,
    setNodes: store.setNodes,
    setEdges: store.setEdges,
    addNode: store.addNode,
    updateNode: store.updateNode,
    deleteNode: store.deleteNode,
    setSelectedNode: store.setSelectedNode,
    
    // Новые функции
    undo: store.undo,
    redo: store.redo,
    clearHistory: store.clearHistory,
    updateViewport: store.updateViewport,
    getPerformanceMetrics: store.getPerformanceMetrics,
    autoSave: store.autoSave,
    loadFromStorage: store.loadFromStorage
  };
};
