import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, Database, BarChart, Save } from 'lucide-react';

interface DemoStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  icon: React.ReactNode;
}

export const DemoWorkflow: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<any>(null);

  const [steps, setSteps] = useState<DemoStep[]>([
    {
      id: 'data_input',
      name: 'Data Input',
      description: 'Получение данных из источника',
      status: 'pending',
      icon: <Database size={20} />
    },
    {
      id: 'data_processing',
      name: 'Data Processing',
      description: 'Обработка и валидация данных',
      status: 'pending',
      icon: <AlertCircle size={20} />
    },
    {
      id: 'data_analysis',
      name: 'Data Analysis',
      description: 'Анализ обработанных данных',
      status: 'pending',
      icon: <BarChart size={20} />
    },
    {
      id: 'save_results',
      name: 'Save Results',
      description: 'Сохранение результатов',
      status: 'pending',
      icon: <Save size={20} />
    }
  ]);

  const executeStep = async (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].status = 'running';
    setSteps(newSteps);

    // Имитация выполнения шага
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Моковые результаты для каждого шага
    const mockResults = {
      data_input: {
        records: 1250,
        size: '2.5 MB',
        source: 'sales_data.csv',
        date_range: '2024-01-01 to 2024-01-31'
      },
      data_processing: {
        processed_records: 1245,
        invalid_records: 5,
        duplicates_removed: 12,
        data_quality: '99.6%'
      },
      data_analysis: {
        total_amount: 45678.90,
        average_transaction: 36.70,
        categories: { Small: 623, Medium: 415, Large: 207 },
        growth_rate: '+12.5%'
      },
      save_results: {
        file_saved: 'analysis_results.json',
        size: '156 KB',
        location: '/results/2024/01/analysis_results.json',
        timestamp: new Date().toISOString()
      }
    };

    newSteps[stepIndex].status = 'completed';
    newSteps[stepIndex].result = mockResults[steps[stepIndex].id as keyof typeof mockResults];
    setSteps(newSteps);

    return mockResults[steps[stepIndex].id as keyof typeof mockResults];
  };

  const runWorkflow = async () => {
    setIsRunning(true);
    setResults(null);
    
    // Сбрасываем статусы
    const resetSteps = steps.map(step => ({ ...step, status: 'pending' as const, result: undefined }));
    setSteps(resetSteps);

    try {
      const workflowResults = [];
      
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        const result = await executeStep(i);
        workflowResults.push(result);
      }

      // Финальные результаты
      const finalResults = {
        workflow_name: 'Data Processing Pipeline Demo',
        execution_time: new Date().toISOString(),
        total_steps: steps.length,
        success_rate: '100%',
        summary: {
          total_records_processed: (workflowResults[0] as any)?.records || 0,
          data_quality_score: '99.6%',
          processing_time: '8.5 seconds',
          total_amount_analyzed: (workflowResults[2] as any)?.total_amount || 0
        },
        detailed_results: workflowResults
      };

      setResults(finalResults);
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
    }
  };

  const resetWorkflow = () => {
    const resetSteps = steps.map(step => ({ ...step, status: 'pending' as const, result: undefined }));
    setSteps(resetSteps);
    setResults(null);
    setCurrentStep(0);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Corallum Workflow Demo
        </h2>
        <p className="text-gray-600">
          Демонстрация автоматизации обработки данных с помощью Corallum
        </p>
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={runWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play size={20} />
          {isRunning ? 'Выполняется...' : 'Запустить Workflow'}
        </button>
        
        <button
          onClick={resetWorkflow}
          disabled={isRunning}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Сбросить
        </button>
      </div>

      {/* Прогресс выполнения */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Прогресс выполнения</span>
          <span className="text-sm text-gray-500">
            {steps.filter(s => s.status === 'completed').length} / {steps.length} шагов
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Шаги workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              step.status === 'completed' 
                ? 'border-green-500 bg-green-50' 
                : step.status === 'running'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${
                step.status === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : step.status === 'running'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle size={20} />
                ) : (
                  step.icon
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{step.name}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
            
            {step.status === 'running' && (
              <div className="mt-2">
                <div className="animate-pulse bg-blue-200 h-2 rounded-full"></div>
              </div>
            )}
            
            {step.result && (
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(step.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Финальные результаты */}
      {results && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-bold text-green-900 mb-4">
            ✅ Workflow выполнен успешно!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Статистика выполнения:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Обработано записей: {results.summary.total_records_processed}</li>
                <li>• Качество данных: {results.summary.data_quality_score}</li>
                <li>• Время выполнения: {results.summary.processing_time}</li>
                <li>• Сумма анализа: ${results.summary.total_amount_analyzed}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Детальная информация:</h4>
              <pre className="text-xs text-green-700 bg-white p-2 rounded border border-green-300">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
