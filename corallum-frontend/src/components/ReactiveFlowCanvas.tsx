import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useReactiveFlow } from '../store/reactiveFlowStore';
import { useFlowStore } from '../store/flowStore';
import { CustomNode } from './CustomNode';
import { Map, Zap, Undo, Redo, Save } from 'lucide-react';

// 🔧 ТИПЫ ДЛЯ ОПТИМИЗАЦИИ
interface PerformancePanelProps {
  metrics: any;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
}

const nodeTypes = {
  default: CustomNode,
};

// 🎯 КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ МЕТРИК
const PerformancePanel: React.FC<PerformancePanelProps> = ({ 
  metrics, 
  onUndo, 
  onRedo, 
  onClearHistory 
}) => {
  return (
    <Panel position="top-right" className="bg-white border rounded-lg shadow-lg p-3 m-2">
      <div className="text-xs font-mono space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span>Render: {metrics.lastRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="flex items-center gap-2">
          <Map className="w-3 h-3 text-blue-500" />
          <span>Nodes: {metrics.visibleNodes}/{metrics.totalNodes}</span>
        </div>
        <div className="flex items-center gap-2">
          <Save className="w-3 h-3 text-green-500" />
          <span>Cache: {metrics.cacheSize?.nodes || 0}</span>
        </div>
        <div className="flex gap-1 mt-2">
          <button
            onClick={onUndo}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            title="Undo"
          >
            <Undo className="w-3 h-3" />
          </button>
          <button
            onClick={onRedo}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            title="Redo"
          >
            <Redo className="w-3 h-3" />
          </button>
          <button
            onClick={onClearHistory}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded"
            title="Clear History"
          >
            Clear
          </button>
        </div>
      </div>
    </Panel>
  );
};

interface ReactiveFlowCanvasProps {
  onNodeClick: (node: any) => void;
}

export const ReactiveFlowCanvas: React.FC<ReactiveFlowCanvasProps> = ({ onNodeClick }) => {
  const [showMinimap, setShowMinimap] = React.useState(false);
  const { x, y, zoom } = useViewport();
  const viewportRef = useRef({ x, y, zoom });
  
  // 🎯 ИСПОЛЬЗУЕМ REACTIVE STORE
  const {
    nodes,
    edges,
    viewportNodes,
    performance,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    undo,
    redo,
    clearHistory,
    getPerformanceMetrics,
    updateViewport
  } = useReactiveFlow();

  // 🔧 ОБНОВЛЕНИЕ VIEWPORT ДЛЯ ВИРТУАЛИЗАЦИИ
  useEffect(() => {
    const viewport = viewportRef.current;
    
    // Вычисляем видимую область с учетом zoom
    const width = window.innerWidth / zoom;
    const height = window.innerHeight / zoom;
    const x1 = -x / zoom;
    const y1 = -y / zoom;
    const x2 = x1 + width;
    const y2 = y1 + height;
    
    updateViewport({ x1, y1, x2, y2 });
    viewportRef.current = { x, y, zoom };
  }, [x, y, zoom, updateViewport]);

  // 🚀 ОПТИМИЗИРОВАННЫЙ ONDRAG
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const boilerplate = event.dataTransfer.getData('application/boilerplate');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // 🎯 ИСПОЛЬЗУЕМ ОПТИМИЗИРОВАННЫЙ addNode
      addNode(type, boilerplate);
    },
    [addNode]
  );

  // 🎯 ОПТИМИЗИРОВАННЫЙ ONNODECLICK
  const onNodeClickInternal = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
    onNodeClick(node);
  }, [setSelectedNode, onNodeClick]);

  // 🚀 МЕМОИЗАЦИЯ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
  const metrics = useMemo(() => getPerformanceMetrics(), [performance, getPerformanceMetrics]);

  // 🔧 АВТОЗАГРУЗКА ПРИ МОНТИРОВАНИИ
  useEffect(() => {
    console.log('🎯 Компонент смонтирован');
  }, []);

  // 🎯 ДЕБУГ ИНФОРМАЦИЯ
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Метрики производительности:', metrics);
    }
  }, [metrics]);

  return (
    <div className="w-full h-full relative">
      {/* 🚀 ОСНОВНОЙ CANVAS С ОПТИМИЗАЦИЕЙ */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickInternal}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        // 🎯 ОПТИМИЗАЦИЯ РЕНДЕРИНГА
        proOptions={{ hideAttribution: true }}
        // 🚀 УЛУЧШЕННАЯ ПРОИЗВОДИТЕЛЬНОСТЬ
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        // 🔧 ВИРТУАЛИЗАЦИЯ
        maxZoom={2}
        minZoom={0.1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="#e5e7eb" gap={16} variant={BackgroundVariant.Dots} />
        
        {/* 🎯 ПАНЕЛЬ УПРАВЛЕНИЯ */}
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-left"
          className="bg-white border rounded-lg shadow-lg"
        />
        
        {/* 🚀 МИНИКАРТА С УЛУЧШЕНИЯМИ */}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              switch (node.data?.type) {
                case 'aiagent': return '#ef4444';
                case 'database': return '#3b82f6';
                case 'api': return '#10b981';
                default: return '#6b7280';
              }
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-right"
            className="bg-white border rounded-lg shadow-lg"
          />
        )}
        
        {/* 🎯 ПАНЕЛЬ ПРОИЗВОДИТЕЛЬНОСТИ */}
        <PerformancePanel
          metrics={metrics}
          onUndo={undo}
          onRedo={redo}
          onClearHistory={clearHistory}
        />
        
        {/* 🚀 ПАНЕЛЬ УПРАВЛЕНИЯ МИНИКАРТОЙ */}
        <Panel position="top-left">
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
              showMinimap 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            <Map className="w-4 h-4 inline mr-2" />
            {showMinimap ? 'Скрыть карту' : 'Показать карту'}
          </button>
        </Panel>
      </ReactFlow>
      
      {/* 🎯 ИНФОРМАЦИОННАЯ ПАНЕЛЬ */}
      <div className="absolute bottom-4 left-4 bg-white border rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-600">
          <div>🚀 Reactive Flow Canvas</div>
          <div>Узлов: {metrics.totalNodes} | Видимых: {metrics.visibleNodes}</div>
          <div>Рендер: {metrics.lastRenderTime.toFixed(2)}ms</div>
        </div>
      </div>
    </div>
  );
};

// 🎯 HOOK ДЛЯ УДОБНОГО ИСПОЛЬЗОВАНИЯ
export const useReactiveFlowCanvas = () => {
  const reactiveFlow = useReactiveFlow();
  
  return {
    ...reactiveFlow,
    // Дополнительные утилиты для canvas
    performanceMetrics: reactiveFlow.getPerformanceMetrics(),
    canUndo: reactiveFlow.history.currentIndex > 0,
    canRedo: reactiveFlow.history.currentIndex < reactiveFlow.history.nodes.length - 1
  };
};
