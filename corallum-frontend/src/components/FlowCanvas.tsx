import React, { useCallback, useState, useMemo, memo } from 'react';
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
import { useFlowStore } from '../store/flowStore';
import { CustomNode } from './CustomNode';
import { Map } from 'lucide-react';

// 🚀 Упрощенный узел без виртуализации для отладки
const VirtualizedNode = memo((props: any) => {
  console.log('🔧 VirtualizedNode called with props:', props);
  
  // React Flow v12 передает пропсы напрямую, а не в объекте node
  const { data, selected, id, type } = props;
  
  // Проверка на данные
  if (!data) {
    console.log('🔧 VirtualizedNode: data is undefined');
    return null;
  }
  
  console.log('🔧 VirtualizedNode: rendering CustomNode with data:', data);
  // В React Flow v12 пропсы передаются напрямую
  return <CustomNode data={data} selected={selected} />;
});

VirtualizedNode.displayName = 'VirtualizedNode';

const nodeTypes = {
  default: VirtualizedNode,
};

interface FlowCanvasProps {
  onNodeClick: (node: any) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = memo(({ onNodeClick }) => {
  const [showMinimap, setShowMinimap] = useState(false);
  
  // 🚀 Оптимизированные селекторы - предотвращаем лишние ре-рендеры
  const nodes = useFlowStore(useCallback(state => state.nodes, []));
  const edges = useFlowStore(useCallback(state => state.edges, []));
  const onNodesChange = useFlowStore(useCallback(state => state.onNodesChange, []));
  const onEdgesChange = useFlowStore(useCallback(state => state.onEdgesChange, []));
  const onConnect = useFlowStore(useCallback(state => state.onConnect, []));
  const addNode = useFlowStore(useCallback(state => state.addNode, []));
  
  // 🎯 Оптимизированные узлы с мемоизацией
  const optimizedNodes = useMemo(() => {
    console.log('🔧 FlowCanvas: nodes:', nodes);
    console.log('🔧 FlowCanvas: nodes.length:', nodes.length);
    return nodes.map(node => ({
      ...node,
      // 🚀 Добавляем performance метаданные
      data: {
        ...node.data,
        lastRendered: Date.now()
      }
    }));
  }, [nodes]);

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

      addNode(type, boilerplate);
      
      // Прокручиваем к новым узлам через небольшую задержку
      setTimeout(() => {
        const reactFlowViewport = document.querySelector('.react-flow__viewport');
        if (reactFlowViewport) {
          // Находим самый правый узел
          const nodes = document.querySelectorAll('.react-flow__node');
          let maxRight = 0;
          nodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const right = rect.left + rect.width;
            if (right > maxRight) maxRight = right;
          });
          
          // Прокручиваем к самому правому узлу
          const container = document.querySelector('.react-flow__pane');
          if (container) {
            container.scrollTo({
              left: maxRight - window.innerWidth / 2,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
    },
    [addNode]
  );

  return (
    <div className="flow-canvas">
      {(() => {
        console.log('🔧 ReactFlow render: nodes:', optimizedNodes, 'nodeTypes:', nodeTypes);
        return null;
      })()}
      <ReactFlow
        nodes={optimizedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        snapGrid={[10, 10]}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={10} size={1.5} color="rgba(255, 255, 255, 0.15)" />
        <Controls />
        {showMinimap && (
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'input':
                  return '#10b981';
                case 'output':
                  return '#ef4444';
                default:
                  return '#3b82f6';
              }
            }}
            pannable
            zoomable
            className="custom-minimap"
          />
        )}
        <Panel position="top-left" className="flow-panel">
          <div className="flow-info">
            <span className="flow-info-label">Режим:</span>
            <span className="flow-info-value">Редактирование</span>
            <span className="flow-info-metrics">
              {nodes.length} узлов, {edges.length} связей
            </span>
          </div>
        </Panel>
      </ReactFlow>
      <button 
        className="minimap-toggle-button"
        onClick={() => setShowMinimap(!showMinimap)}
        title={showMinimap ? "Hide Minimap" : "Show Minimap"}
      >
        <Map size={18} />
      </button>
    </div>
  );
});

FlowCanvas.displayName = 'FlowCanvas';
