const http = require('http');

const PORT = 8000;

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
      script: 'def process(data):\\n    return {"result": data}',
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Routes
const routes = {
  'GET /health': () => ({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  }),
  
  'GET /api/v1/nodes': () => ({
    success: true,
    data: {
      nodes: mockNodeTypes,
      count: mockNodeTypes.length
    },
    timestamp: new Date().toISOString()
  }),
  
  'POST /api/v1/nodes/:type/execute': (req, params) => {
    console.log(`Executing node: ${params.type}`);
    return {
      success: true,
      data: {
        result: {
          status: 'success',
          output: `Executed ${params.type} successfully`,
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    };
  },
  
  'GET /api/v1/workflows': () => ({
    success: true,
    data: [
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
    ],
    timestamp: new Date().toISOString()
  }),
  
  'POST /api/v1/workflows': (req) => {
    const workflow = {
      id: `workflow-${Date.now()}`,
      ...req.body,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: {
        id: workflow.id,
        version: workflow.version
      },
      timestamp: new Date().toISOString()
    };
  }
};

// Parse request body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Route matcher
function matchRoute(method, path) {
  for (const [route, handler] of Object.entries(routes)) {
    const [routeMethod, routePath] = route.split(' ');
    if (routeMethod !== method) continue;
    
    // Simple parameter matching
    const routeParts = routePath.split('/');
    const pathParts = path.split('/');
    
    if (routeParts.length !== pathParts.length) continue;
    
    const params = {};
    let match = true;
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      return { handler, params };
    }
  }
  
  return null;
}

// Create server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const route = matchRoute(req.method, url.pathname);
    
    if (route) {
      const body = req.method !== 'GET' ? await parseBody(req) : {};
      const result = route.handler(body, route.params);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Simple Corallum Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/v1/`);
  console.log(`✅ Server ready for frontend testing!`);
});

module.exports = server;
