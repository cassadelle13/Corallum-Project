const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }));
    return;
  }
  
  // Node types endpoint
  if (req.url === '/api/v1/nodes' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        nodes: [
          {
            type: 'python',
            displayName: 'Python Script',
            description: 'Execute Python code',
            icon: '🐍',
            category: 'operators',
            color: '#3776ab'
          },
          {
            type: 'http-request',
            displayName: 'HTTP Request',
            description: 'Make HTTP requests',
            icon: '🌐',
            category: 'integrations',
            color: '#00a8e8'
          }
        ],
        count: 2
      },
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Workflows endpoint
  if (req.url === '/api/v1/workflows' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
    return;
  }
  
  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Corallum Mock API Server',
    endpoints: ['/health', '/api/v1/nodes', '/api/v1/workflows'],
    timestamp: new Date().toISOString()
  }));
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`🚀 Corallum Test Server running on http://localhost:${PORT}`);
  console.log(`✅ Ready for frontend testing!`);
});
