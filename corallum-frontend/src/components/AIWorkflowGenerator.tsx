import React, { useState } from 'react';
import { Wand2, Loader2, CheckCircle, AlertCircle, Lightbulb, Zap } from 'lucide-react';
import { jariloService, type JariloWorkflowRequest } from '../services/api';
import { useReactiveFlow } from '../store/reactiveFlowStore';

interface AIWorkflowGeneratorProps {
  onWorkflowGenerated: (workflow: any) => void;
}

export const AIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({ 
  onWorkflowGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // 🚀 ИСПОЛЬЗУЕМ REACTIVE STORE
  const { setNodes, setEdges, addNode, performance } = useReactiveFlow();

  const availableIntegrations = [
    'postgresql', 'redis', 'slack', 'email', 'webhook', 
    'python', 'javascript', 'api', 'database', 'file'
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Пожалуйста, опишите какой workflow вы хотите создать');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Проверяем доступность Jarilo
      const isJariloAvailable = await jariloService.healthCheck();
      if (!isJariloAvailable) {
        throw new Error('Jarilo AI сервис недоступен. Убедитесь что Jarilo запущен на порту 8004');
      }

      const request: JariloWorkflowRequest = {
        description: description.trim(),
        requirements: requirements ? requirements.split(',').map(r => r.trim()) : [],
        integrations: selectedIntegrations,
        constraints: {
          max_nodes: 20,
          timeout: 300,
          parallel_execution: true
        }
      };

      console.log('🚀 Generating workflow with Jarilo AI...');
      console.log('📊 Performance metrics before generation:', performance);
      
      const response = await jariloService.generateWorkflow(request);
      
      setResult(response);
      
      if (response.workflow) {
        // Валидация workflow перед установкой
        const nodes = response.workflow.nodes || [];
        const edges = response.workflow.edges || [];
        
        if (!Array.isArray(nodes) || !Array.isArray(edges)) {
          throw new Error('Неверный формат workflow от Jarilo AI');
        }
        
        if (nodes.length === 0) {
          throw new Error('Jarilo AI не смог сгенерировать узлы workflow');
        }
        
        // 🚀 НОРМАЛИЗУЕМ WORKFLOW С ОПТИМИЗАЦИЕЙ
        const normalizedWorkflow = {
          nodes: nodes.map((node, index) => ({
            id: node.id || `node_${index}`,
            type: node.type || 'default',
            position: node.position || { x: 100 + (index * 200), y: 100 },
            data: {
              ...node.data,
              label: node.data?.label || node.label || `Node ${index + 1}`,
              // 🎯 Добавляем метаданные производительности
              _generated: true,
              _generationTime: Date.now(),
              _aiConfidence: response.analysis?.confidence || 0.8
            }
          })),
          edges: edges.map((edge, index) => ({
            id: edge.id || `edge_${index}`,
            source: edge.source,
            target: edge.target,
            type: edge.type || 'default',
            data: {
              _generated: true,
              _aiOptimized: true
            }
          })),
          metadata: {
            generated_by: 'jarilo_ai',
            confidence: response.analysis?.confidence || 0.8,
            created_at: new Date().toISOString(),
            total_nodes: nodes.length,
            total_edges: edges.length,
            performance_optimized: true
          }
        };

        // 🚀 ИСПОЛЬЗУЕМ ОПТИМИЗИРОВАННЫЙ SETNODES
        console.log('🎯 Устанавливаем узлы через reactive store...');
        const startTime = window.performance.now();
        
        setNodes(normalizedWorkflow.nodes);
        setEdges(normalizedWorkflow.edges);
        
        const endTime = window.performance.now();
        console.log(`✅ Workflow установлен за ${(endTime - startTime).toFixed(2)}ms`);
        console.log('📊 Performance metrics after generation:', performance);

        onWorkflowGenerated(normalizedWorkflow);
      }
    } catch (err) {
      console.error('AI Workflow generation failed:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при генерации workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIntegration = (integration: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integration) 
        ? prev.filter(i => i !== integration)
        : [...prev, integration]
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600 text-white rounded-lg">
          <Wand2 size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI Workflow Generator</h3>
          <p className="text-sm text-gray-600">Создавайте workflow с помощью искусственного интеллекта</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Описание workflow */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lightbulb size={16} className="inline mr-1" />
            Опишите ваш workflow
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: Создайте workflow для обработки заказов из e-commerce, который проверяет наличие товаров, отправляет уведомления и обновляет базу данных..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={isGenerating}
          />
        </div>

        {/* Требования */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Требования (через запятую)
          </label>
          <input
            type="text"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Например: высокая производительность, отказоустойчивость, логирование"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          />
        </div>

        {/* Интеграции */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Zap size={16} className="inline mr-1" />
            Необходимые интеграции
          </label>
          <div className="flex flex-wrap gap-2">
            {availableIntegrations.map(integration => (
              <button
                key={integration}
                onClick={() => toggleIntegration(integration)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedIntegrations.includes(integration)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isGenerating}
              >
                {integration}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка генерации */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Генерируем workflow...
            </>
          ) : (
            <>
              <Wand2 size={20} />
              Создать workflow с AI
            </>
          )}
        </button>

        {/* Ошибка */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span className="font-medium">Ошибка</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Результат */}
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle size={20} />
              <span className="font-medium">Workflow успешно создан!</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Сгенерировано узлов: {result.workflow?.nodes?.length || 0}</p>
              <p>• Связей: {result.workflow?.edges?.length || 0}</p>
              <p>• Уверенность AI: {Math.round((result.analysis?.confidence || 0) * 100)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
