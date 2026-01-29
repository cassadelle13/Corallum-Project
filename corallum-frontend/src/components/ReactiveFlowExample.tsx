import React from 'react';
import { ReactiveFlowCanvas } from './ReactiveFlowCanvas';
import { useReactiveFlow, useReactiveFlowStore } from '../store/reactiveFlowStore';

// 🎯 ПРИМЕР ИСПОЛЬЗОВАНИЯ REACTIVE FLOW
export const ReactiveFlowExample: React.FC = () => {
  const { 
    nodes, 
    edges, 
    performance, 
    addNode, 
    undo, 
    redo, 
    getPerformanceMetrics,
    history
  } = useReactiveFlow();

  const handleNodeClick = (node: any) => {
    console.log('🎯 Узел выбран:', node);
  };

  const handleAddTestNode = () => {
    addNode('test', 'console.log("Hello Reactive Flow!");');
  };

  const handleClearAll = () => {
    useReactiveFlowStore.getState().setNodes([]);
    useReactiveFlowStore.getState().setEdges([]);
  };

  const metrics = getPerformanceMetrics();

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 🎯 ПАНЕЛЬ УПРАВЛЕНИЯ */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              🚀 Reactive Flow Canvas
            </h1>
            <p className="text-sm text-gray-600">
              Оптимизированный workflow редактор с производительностью +{((1 - performance.lastRenderTime / 100) * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAddTestNode}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ➕ Добавить узел
            </button>
            <button
              onClick={undo}
              disabled={metrics.historySize <= 1}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              ↩️ Undo
            </button>
            <button
              onClick={redo}
              disabled={metrics.historySize <= 1}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              ↪️ Redo
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🗑️ Очистить
            </button>
          </div>
        </div>
        
        {/* 📊 МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ */}
        <div className="mt-4 flex gap-4 text-sm">
          <div className="bg-blue-50 px-3 py-1 rounded">
            🔥 Render: {performance.lastRenderTime.toFixed(2)}ms
          </div>
          <div className="bg-green-50 px-3 py-1 rounded">
            📦 Узлов: {performance.totalNodes}
          </div>
          <div className="bg-purple-50 px-3 py-1 rounded">
            👁️ Видимых: {performance.visibleNodes}
          </div>
          <div className="bg-yellow-50 px-3 py-1 rounded">
            💾 Кэш: {metrics.cacheSize?.nodes || 0}
          </div>
          <div className="bg-red-50 px-3 py-1 rounded">
            📈 История: {metrics.historySize}
          </div>
        </div>
      </div>

      {/* 🚀 CANVAS */}
      <div className="flex-1">
        <ReactiveFlowCanvas onNodeClick={handleNodeClick} />
      </div>
      
      {/* 🎯 INFO ПАНЕЛЬ */}
      <div className="bg-gray-50 border-t p-4">
        <div className="text-sm text-gray-600">
          <div className="font-semibold mb-2">🎯 Улучшения Reactive Flow:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>✅ Реактивные узлы</div>
            <div>✅ Виртуализация</div>
            <div>✅ Кэширование</div>
            <div>✅ Undo/Redo</div>
            <div>✅ Автосохранение</div>
            <div>✅ Метрики</div>
            <div>✅ Оптимизация</div>
            <div>✅ Адаптивный рендер</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎯 ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В APP
export default ReactiveFlowExample;
