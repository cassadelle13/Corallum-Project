// Простой API сервер для Corallum
const http = require('http');
const url = require('url');

const workflows = [
  { id: 1, name: 'Synchronize Hub Resource types with instance', user: 'u/admin/hub_sync', description: 'Sync resource types' },
  { id: 2, name: 'New User Setup App', user: 'g/all/setup_app', description: 'Setup new users' },
  { id: 3, name: 'Lead Generation Workflow', user: 'u/admin/leads', description: 'Generate leads' }
];

const executions = [
  { id: 1, workflowId: 1, status: 'success', started: new Date().toISOString(), duration: 1500 },
  { id: 2, workflowId: 2, status: 'running', started: new Date().toISOString(), duration: 0 },
  { id: 3, workflowId: 3, status: 'error', started: new Date().toISOString(), duration: 800 }
];

const resources = [
  { id: 1, name: 'PostgreSQL Database', type: 'database', status: 'connected' },
  { id: 2, name: 'Redis Cache', type: 'cache', status: 'connected' },
  { id: 3, name: 'SMTP Server', type: 'email', status: 'disconnected' }
];

const schedules = [
  { id: 1, name: 'Daily Backup', path: 'f/backup_script', enabled: true, schedule: '0 2 * * *' },
  { id: 2, name: 'Weekly Report', path: 'f/report_generator', enabled: true, schedule: '0 9 * * 1' },
  { id: 3, name: 'Hourly Sync', path: 'f/data_sync', enabled: false, schedule: '0 * * * *' }
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Health check
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Workflows
  if (path === '/api/workflows') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(workflows));
    return;
  }

  if (path === '/api/workflows' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newWorkflow = JSON.parse(body);
      newWorkflow.id = workflows.length + 1;
      workflows.push(newWorkflow);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newWorkflow));
    });
    return;
  }

  // Executions
  if (path === '/api/executions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(executions));
    return;
  }

  // Resources
  if (path === '/api/resources') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resources));
    return;
  }

  if (path === '/api/resources' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newResource = JSON.parse(body);
      newResource.id = resources.length + 1;
      resources.push(newResource);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newResource));
    });
    return;
  }

  // Schedules
  if (path === '/api/schedules') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(schedules));
    return;
  }

  if (path === '/api/schedules' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newSchedule = JSON.parse(body);
      newSchedule.id = schedules.length + 1;
      schedules.push(newSchedule);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newSchedule));
    });
    return;
  }

  // Workspace
  if (path === '/api/workspace') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'admins',
      name: 'Admins workspace',
      description: 'Admin workspace for system management',
      workspaceSettings: {}
    }));
    return;
  }

  // Users
  if (path === '/api/users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, email: 'admin@example.com', name: 'Admin User', isSuperAdmin: true },
      { id: 2, email: 'user@example.com', name: 'Regular User', isSuperAdmin: false }
    ]));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`🚀 Corallum API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/workflows`);
  console.log(`   POST /api/workflows`);
  console.log(`   GET  /api/executions`);
  console.log(`   GET  /api/resources`);
  console.log(`   POST /api/resources`);
  console.log(`   GET  /api/schedules`);
  console.log(`   POST /api/schedules`);
  console.log(`   GET  /api/workspace`);
  console.log(`   GET  /api/users`);
});
