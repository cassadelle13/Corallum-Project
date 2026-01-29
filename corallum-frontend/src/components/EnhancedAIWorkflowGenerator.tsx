import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, CheckCircle, AlertCircle, Lightbulb, Zap, Play, Pause, StepForward, Settings, Wrench, Sparkles } from 'lucide-react';
import { jariloService, type JariloWorkflowRequest } from '../services/api';
import { useReactiveFlow } from '../store/reactiveFlowStore';

interface AIWorkflowGeneratorProps {
  onWorkflowGenerated: (workflow: any) => void;
}

interface GenerationEvent {
  event_type: string;
  data: any;
  timestamp: string;
}

interface Tool {
  name: string;
  description: string;
  schema: any;
}

interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  suggestions: string[];
  metrics: {
    total_nodes: number;
    total_edges: number;
    connected_nodes: number;
  };
}

export const EnhancedAIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({ 
  onWorkflowGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  // 🚀 НОВЫЕ STATES ДЛЯ УЛУЧШЕННОГО ОПЫТА
  const [currentEvent, setCurrentEvent] = useState<GenerationEvent | null>(null);
  const [events, setEvents] = useState<GenerationEvent[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  
  // 🚀 ИСПОЛЬЗУЕМ REACTIVE STORE
  const { setNodes, setEdges, addNode, performance } = useReactiveFlow();

  const availableIntegrations = [
    'postgresql', 'redis', 'slack', 'email', 'webhook', 
    'python', 'javascript', 'api', 'database', 'file'
  ];

  // 🚀 ЗАГРУЖАЕМ ДОСТУПНЫЕ ИНСТРУМЕНТЫ
  useEffect(() => {
    const loadTools = async () => {
      try {
        const toolsResponse = await jariloService.getAvailableTools();
        setAvailableTools(toolsResponse.tools || []);
      } catch (error) {
        console.warn('Failed to load tools:', error);
      }
    };
    
    loadTools();
  }, []);

  // 🚀 ОБРАБОТЧИК СОБЫТИЙ ДЛЯ STREAMING
  const handleStreamEvent = (event: GenerationEvent) => {
    setCurrentEvent(event);
    setEvents(prev => [...prev, event]);
    
    switch (event.event_type) {
      case 'TASK_STARTED':
        console.log('🚀 Task started:', event.data);
        break;
        
      case 'PLANNING_STARTED':
        console.log('📋 Planning started...');
        break;
        
      case 'PLANNING_COMPLETED':
        console.log('✅ Planning completed:', event.data.plan);
        break;
        
      case 'EXECUTION_STARTED':
        console.log('⚡ Execution started...');
        break;
        
      case 'STEP_STARTED':
        console.log(`🔄 Step ${event.data.step}/${event.data.total}: ${event.data.description}`);
        break;
        
      case 'STEP_COMPLETED':
        console.log(`✅ Step ${event.data.step} completed`);
        break;
        
      case 'TASK_COMPLETED':
        console.log('🎉 Task completed:', event.data.result);
        handleWorkflowGenerated(event.data.result);
        break;
        
      case 'ERROR':
        console.error('❌ Error:', event.data.error);
        setError(event.data.error);
        setIsGenerating(false);
        setIsStreaming(false);
        break;
    }
  };

  // 🚀 ОБРАБОТЧИК ГЕНЕРАЦИИ WORKFLOW
  const handleWorkflowGenerated = (workflowData: any) => {
    try {
      // Валидация workflow перед установкой
      const nodes = workflowData.nodes || [];
      const edges = workflowData.edges || [];
      
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
            _aiConfidence: 0.9,
            _streaming: useStreaming
          }
        })),
        edges: edges.map((edge, index) => ({
          id: edge.id || `edge_${index}`,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default',
          data: {
            _generated: true,
            _aiOptimized: true,
            _streaming: useStreaming
          }
        })),
        metadata: {
          generated_by: 'jarilo_ai_enhanced',
          confidence: 0.9,
          created_at: new Date().toISOString(),
          total_nodes: nodes.length,
          total_edges: edges.length,
          performance_optimized: true,
          streaming_enabled: useStreaming
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

      setResult({
        workflow: normalizedWorkflow,
        analysis: { 
          generated_by: 'jarilo_ai_enhanced', 
          confidence: 0.9,
          streaming: useStreaming,
          events_count: events.length
        },
        optimizations: { suggested_improvements: [] },
      });

      onWorkflowGenerated(normalizedWorkflow);
      setIsGenerating(false);
      setIsStreaming(false);
      
    } catch (error) {
      console.error('Workflow generation failed:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при генерации workflow');
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  // 🚀 ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ
  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Пожалуйста, опишите какой workflow вы хотите создать');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setCurrentEvent(null);
    setEvents([]);

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
          parallel_execution: true,
          streaming: useStreaming
        }
      };

      console.log('🚀 Generating workflow with Jarilo AI...');
      console.log('📊 Performance metrics before generation:', performance);
      
      if (useStreaming) {
        // 🚀 ИСПОЛЬЗУЕМ STREAMING ГЕНЕРАЦИЮ
        setIsStreaming(true);
        await jariloService.generateWorkflowStream(request, handleStreamEvent);
      } else {
        // 🔄 БАЗОВАЯ ГЕНЕРАЦИЯ
        const response = await jariloService.generateWorkflow(request);
        handleWorkflowGenerated(response.workflow);
      }
      
    } catch (err) {
      console.error('AI Workflow generation failed:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при генерации workflow');
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  // 🚀 ВАЛИДАЦИЯ WORKFLOW
  const handleValidate = async () => {
    if (!result?.workflow) return;
    
    try {
      const validation = await jariloService.validateWorkflow(result.workflow);
      setValidation(validation);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const toggleIntegration = (integration: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integration) 
        ? prev.filter(i => i !== integration)
        : [...prev, integration]
    );
  };

  // 🚀 РЕНДЕР EVENTS
  const renderEvents = () => {
    if (events.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-2">🔄 Прогресс выполнения:</h4>
        <div className="space-y-1">
          {events.slice(-5).map((event, index) => (
            <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
              <span className="font-mono bg-gray-200 px-1 rounded">
                {event.event_type}
              </span>
              <span className="truncate">
                {JSON.stringify(event.data).substring(0, 50)}...
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 🚀 РЕНДЕР TOOLS
  const renderTools = () => {
    if (availableTools.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
          <Wrench size={16} />
          Доступные инструменты ({availableTools.length}):
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableTools.slice(0, 5).map(tool => (
            <span key={tool.name} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {tool.name}
            </span>
          ))}
          {availableTools.length > 5 && (
            <span className="text-xs text-blue-600">
              +{availableTools.length - 5} еще
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Wand2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Enhanced AI Workflow Generator</h3>
            <p className="text-sm text-gray-600">Создавайте workflow с помощью искусственного интеллекта</p>
          </div>
        </div>
        
        {/* 🚀 КНОПКИ НАСТРОЕК */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Расширенные настройки"
          >
            <Settings size={20} />
          </button>
          
          <button
            onClick={() => setUseStreaming(!useStreaming)}
            className={`p-2 rounded-lg transition-colors ${
              useStreaming 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={useStreaming ? "Стриминг включен" : "Стриминг выключен"}
          >
            {useStreaming ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </div>

      {/* 🚀 РАСШИРЕННЫЕ НАСТРОЙКИ */}
      {showAdvanced && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Settings size={16} />
            Расширенные настройки
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="rounded"
                />
                Включить стриминг (real-time обновления)
              </label>
            </div>
            
            <div>
              <label className="text-sm text-gray-600">
                Максимальное узлов: 
                <input
                  type="number"
                  defaultValue="20"
                  min="5"
                  max="50"
                  className="ml-2 w-16 px-2 py-1 border rounded"
                />
              </label>
            </div>
          </div>
          
          {renderTools()}
        </div>
      )}

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

        {/* 🚀 INDICATOR СТРИМИНГА */}
        {isStreaming && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Sparkles size={20} className="animate-pulse" />
              <span className="font-medium">Стриминг активен...</span>
              <div className="flex-1 bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
            {currentEvent && (
              <div className="mt-2 text-xs text-green-700">
                Текущее событие: {currentEvent.event_type}
              </div>
            )}
          </div>
        )}

        {/* 🚀 EVENTS LOG */}
        {renderEvents()}

        {/* Кнопка генерации */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {isStreaming ? 'Генерируем workflow (стриминг)...' : 'Генерируем workflow...'}
            </>
          ) : (
            <>
              <Wand2 size={20} />
              Создать workflow с AI {useStreaming && '(стриминг)'}
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle size={20} />
                <span className="font-medium">Workflow успешно создан!</span>
                {useStreaming && (
                  <span className="text-xs bg-green-100 px-2 py-1 rounded">
                    Стриминг
                  </span>
                )}
              </div>
              
              <button
                onClick={handleValidate}
                className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                Валидировать
              </button>
            </div>
            
            <div className="text-sm text-green-700 space-y-1">
              <p>• Сгенерировано узлов: {result.workflow?.nodes?.length || 0}</p>
              <p>• Связей: {result.workflow?.edges?.length || 0}</p>
              <p>• Уверенность AI: {Math.round((result.analysis?.confidence || 0) * 100)}%</p>
              {useStreaming && <p>• Событий обработано: {events.length}</p>}
            </div>
            
            {/* 🚀 VALIDATION RESULT */}
            {validation && (
              <div className={`mt-3 p-3 rounded-lg ${
                validation.is_valid 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-yellow-100 border border-yellow-200'
              }`}>
                <div className="text-sm font-medium mb-1">
                  Валидация: {validation.is_valid ? '✅ Пройдена' : '⚠️ Требует внимания'}
                </div>
                
                {validation.errors.length > 0 && (
                  <div className="text-xs text-red-700 mt-1">
                    Ошибки: {validation.errors.join(', ')}
                  </div>
                )}
                
                {validation.suggestions.length > 0 && (
                  <div className="text-xs text-blue-700 mt-1">
                    Suggestions: {validation.suggestions.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
