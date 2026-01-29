// Load Testing Script для Production Ready проверки
// Использует Artillery для симуляции реальной нагрузки

const { check } = require('artillery');

// Конфигурация нагрузочного тестирования
const loadTestConfig = {
  config: {
    target: 'http://localhost:8003',
    phases: [
      // Разогрев
      { duration: 60, arrivalRate: 10 },
      // Базовая нагрузка
      { duration: 300, arrivalRate: 50 },
      // Пиковая нагрузка
      { duration: 120, arrivalRate: 200 },
      // Стресс тест
      { duration: 60, arrivalRate: 500 },
      // Восстановление
      { duration: 180, arrivalRate: 100 }
    ],
    payload: {
      path: './tests/performance/test-data.csv',
      fields: ['userId', 'tenantId', 'workflowId']
    },
    processor: './tests/performance/data-processor.js',
    http: {
      timeout: 30,
      pool: 50
    },
    metrics: {
      'http.response_time': {
        percentile: [50, 90, 95, 99]
      }
    }
  },

  // Сценарии тестирования
  scenarios: [
    {
      name: 'Health Check Load',
      weight: 10,
      flow: [
        {
          get: {
            url: '/health',
            expectStatus: 200,
            expect: (response) => {
              return response.body.status === 'healthy';
            }
          }
        }
      ]
    },

    {
      name: 'Authentication Flow',
      weight: 20,
      flow: [
        {
          post: {
            url: '/api/v2/enterprise/auth/login',
            json: {
              email: 'test@example.com',
              password: 'testpassword123'
            },
            expectStatus: 200,
            capture: {
              json: '$.data.token',
              as: 'authToken'
            }
          }
        },
        {
          get: {
            url: '/api/v2/enterprise/features',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            },
            expectStatus: 200
          }
        }
      ]
    },

    {
      name: 'AI Workflow Generation',
      weight: 30,
      flow: [
        {
          post: {
            url: '/api/v2/ai/generate-workflow',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              description: 'Automate customer onboarding process',
              businessContext: 'SaaS company with 1000+ customers',
              industry: 'technology'
            },
            expectStatus: 200,
            expect: (response) => {
              return response.body.data.confidence > 0.8;
            },
            capture: {
              json: '$.data.workflow.id',
              as: 'workflowId'
            }
          }
        }
      ]
    },

    {
      name: 'Reliable Execution',
      weight: 25,
      flow: [
        {
          post: {
            url: '/api/v2/reliability/execute-workflow',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              workflowId: '{{ workflowId }}',
              workflowDefinition: {
                nodes: [
                  { id: 'start', type: 'trigger', position: { x: 100, y: 100 } },
                  { id: 'process', type: 'process', position: { x: 300, y: 100 } },
                  { id: 'end', type: 'output', position: { x: 500, y: 100 } }
                ],
                edges: [
                  { id: 'e1', source: 'start', target: 'process' },
                  { id: 'e2', source: 'process', target: 'end' }
                ]
              },
              input: { customerId: '{{ userId }}', tenantId: '{{ tenantId }}' }
            },
            expectStatus: 200,
            capture: {
              json: '$.data.executionId',
              as: 'executionId'
            }
          }
        },
        {
          think: 5 // Пауза 5 секунд для выполнения
        },
        {
          get: {
            url: '/api/v2/reliability/executions/{{ executionId }}',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            },
            expectStatus: 200,
            expect: (response) => {
              return ['running', 'completed'].includes(response.body.data.status);
            }
          }
        }
      ]
    },

    {
      name: 'Metrics and Monitoring',
      weight: 15,
      flow: [
        {
          get: {
            url: '/metrics',
            expectStatus: 200,
            expect: (response) => {
              return response.body.database && response.body.cache;
            }
          }
        }
      ]
    }
  ]
};

// Критерии успеха для Production Ready
const successCriteria = {
  responseTime: {
    p50: '<200ms',    // 50% запросов быстрее 200ms
    p90: '<500ms',    // 90% запросов быстрее 500ms
    p95: '<1000ms',   // 95% запросов быстрее 1s
    p99: '<2000ms'    // 99% запросов быстрее 2s
  },
  throughput: {
    min: '100 req/s', // Минимум 100 запросов в секунду
    peak: '500 req/s' // Пиковая нагрузка 500 запросов в секунду
  },
  errorRate: {
    max: '1%'        // Максимальная частота ошибок 1%
  },
  availability: {
    min: '99.9%'     // Минимальная доступность 99.9%
  },
  resourceUsage: {
    cpu: '<70%',      // Максимальная загрузка CPU 70%
    memory: '<80%',   // Максимальное использование памяти 80%
    disk: '<85%'      // Максимальное использование диска 85%
  }
};

// Функция запуска тестирования
async function runLoadTest() {
  console.log('🚀 Starting Production Load Testing...');
  console.log('=====================================');
  
  try {
    // Запуск Artillery
    const artillery = require('artillery');
    
    console.log('📊 Load Test Configuration:');
    console.log(`- Target: ${loadTestConfig.config.target}`);
    console.log(`- Max Users: ${loadTestConfig.config.phases.reduce((sum, phase) => Math.max(sum, phase.arrivalRate), 0)}`);
    console.log(`- Duration: ${loadTestConfig.config.phases.reduce((sum, phase) => sum + phase.duration, 0)}s`);
    
    // Запуск теста
    const results = await artillery.run(loadTestConfig);
    
    // Анализ результатов
    analyzeResults(results);
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

// Анализ результатов тестирования
function analyzeResults(results) {
  console.log('\n📈 Load Test Results Analysis');
  console.log('===============================');
  
  const metrics = results.aggregate;
  
  // Проверка времени отклика
  console.log('\n⏱️ Response Times:');
  console.log(`- P50: ${metrics.http.response_time.p50}ms`);
  console.log(`- P90: ${metrics.http.response_time.p90}ms`);
  console.log(`- P95: ${metrics.http.response_time.p95}ms`);
  console.log(`- P99: ${metrics.http.response_time.p99}ms`);
  
  // Проверка пропускной способности
  console.log('\n📊 Throughput:');
  console.log(`- Requests/sec: ${metrics.http.requests.rate}`);
  console.log(`- Total requests: ${metrics.http.requests.count}`);
  
  // Проверка ошибок
  console.log('\n❌ Errors:');
  console.log(`- Error rate: ${((metrics.http.errors.count / metrics.http.requests.count) * 100).toFixed(2)}%`);
  console.log(`- Total errors: ${metrics.http.errors.count}`);
  
  // Оценка Production Ready
  const isProductionReady = evaluateProductionReadiness(metrics);
  
  console.log('\n🎯 Production Ready Assessment:');
  console.log(`Status: ${isProductionReady.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Score: ${isProductionReady.score}/100`);
  
  if (!isProductionReady.passed) {
    console.log('\n🔧 Issues to fix:');
    isProductionReady.issues.forEach(issue => {
      console.log(`- ${issue}`);
    });
  }
  
  // Генерация отчета
  generateReport(results, isProductionReady);
}

// Оценка Production Ready
function evaluateProductionReadiness(metrics) {
  let score = 100;
  const issues = [];
  
  // Проверка времени отклика
  if (metrics.http.response_time.p95 > 1000) {
    score -= 20;
    issues.push('P95 response time > 1s');
  }
  
  if (metrics.http.response_time.p99 > 2000) {
    score -= 15;
    issues.push('P99 response time > 2s');
  }
  
  // Проверка пропускной способности
  if (metrics.http.requests.rate < 100) {
    score -= 25;
    issues.push('Throughput < 100 req/s');
  }
  
  // Проверка ошибок
  const errorRate = (metrics.http.errors.count / metrics.http.requests.count) * 100;
  if (errorRate > 1) {
    score -= 30;
    issues.push(`Error rate ${errorRate.toFixed(2)}% > 1%`);
  }
  
  return {
    passed: score >= 90,
    score: Math.max(0, score),
    issues
  };
}

// Генерация детального отчета
function generateReport(results, assessment) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: results.aggregate.http.requests.count,
      duration: results.aggregate.http.requests.duration,
      throughput: results.aggregate.http.requests.rate,
      errorRate: ((results.aggregate.http.errors.count / results.aggregate.http.requests.count) * 100).toFixed(2),
      p95ResponseTime: results.aggregate.http.response_time.p95,
      p99ResponseTime: results.aggregate.http.response_time.p99
    },
    productionReady: assessment,
    recommendations: generateRecommendations(results, assessment)
  };
  
  // Сохранение отчета
  const fs = require('fs');
  fs.writeFileSync('./load-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📄 Detailed report saved to: load-test-report.json');
}

// Генерация рекомендаций
function generateRecommendations(results, assessment) {
  const recommendations = [];
  
  if (assessment.score < 90) {
    recommendations.push('Consider implementing additional caching layers');
    recommendations.push('Optimize database queries and add indexes');
    recommendations.push('Implement horizontal scaling with load balancer');
    recommendations.push('Add CDN for static content delivery');
  }
  
  if (results.aggregate.http.response_time.p95 > 500) {
    recommendations.push('Add Redis caching for frequently accessed data');
    recommendations.push('Implement database connection pooling optimization');
  }
  
  if (results.aggregate.http.requests.rate < 200) {
    recommendations.push('Scale horizontally with multiple app instances');
    recommendations.push('Implement async processing for heavy operations');
  }
  
  return recommendations;
}

// Запуск тестирования
if (require.main === module) {
  runLoadTest();
}

module.exports = { loadTestConfig, successCriteria, runLoadTest };
