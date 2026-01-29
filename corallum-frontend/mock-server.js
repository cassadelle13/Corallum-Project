const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockNodeTypes = [
  {
    type: 'python',
    displayName: 'Python Script',
    description: 'Execute Python code',
    icon: '🐍',
    category: 'operators',
    color: '#3776ab',
    parameters: {
      script: 'def process(data):\n    return {"result": data}',
      timeout: 30
    }
  },
  {
    type: 'http-request',
    displayName: 'HTTP Request',
    description: 'Make HTTP requests',
    icon: '🌐',
    category: 'integrations',
    color: '#00a8e8',
    parameters: {
      url: 'https://api.example.com',
      method: 'GET',
      headers: {}
    }
  },
  {
    type: 'data-transform',
    displayName: 'Data Transform',
    description: 'Transform data structure',
    icon: '🔄',
    category: 'operators',
    color: '#ff6b6b',
    parameters: {
      transform: 'map',
      mapping: {}
    }
  }
];

const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'Sample Workflow',
    description: 'A sample workflow for testing',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: []
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/v1/nodes', (req, res) => {
  res.json({
    success: true,
    data: {
      nodes: mockNodeTypes,
      count: mockNodeTypes.length
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/nodes/:type/execute', (req, res) => {
  const { type } = req.params;
  const { parameters } = req.body;
  
  console.log(`Executing node: ${type}`, parameters);
  
  // Simulate execution
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        result: {
          status: 'success',
          output: `Executed ${type} with parameters: ${JSON.stringify(parameters)}`,
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

app.get('/api/v1/workflows', (req, res) => {
  res.json({
    success: true,
    data: mockWorkflows,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/workflows', (req, res) => {
  const workflow = {
    id: `workflow-${Date.now()}`,
    ...req.body,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockWorkflows.push(workflow);
  
  res.json({
    success: true,
    data: {
      id: workflow.id,
      version: workflow.version
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/workflows/:id', (req, res) => {
  const { id } = req.params;
  const workflow = mockWorkflows.find(w => w.id === id);
  
  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: 'Workflow not found',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    data: workflow,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/workflows/:id/execute', (req, res) => {
  const { id } = req.params;
  const triggerData = req.body;
  
  console.log(`Executing workflow: ${id}`, triggerData);
  
  // Simulate workflow execution
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        execution: {
          id: `exec-${Date.now()}`,
          workflowId: id,
          status: 'success',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          result: {
            message: 'Workflow executed successfully',
            nodes: [
              {
                nodeId: 'node-1',
                status: 'success',
                output: 'Node executed successfully'
              }
            ]
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

// WebSocket endpoint for real-time updates
app.get('/ws', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'WebSocket endpoint - use ws://localhost:8000/ws',
      status: 'available'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Corallum Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/v1/`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}/ws`);
});

module.exports = app;
