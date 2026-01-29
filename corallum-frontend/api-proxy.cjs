// API прокси для совместимости фронтенда с Docker бэкендом
const http = require('http');
const url = require('url');

// Прокси для перенаправления запросов
const proxy = http.createServer((req, res) => {
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
  const method = req.method;

  console.log(`🔄 Proxy: ${method} ${path}`);

  // Health check - перенаправляем на правильный эндпоинт
  if (path === '/api/health') {
    http.get('http://localhost:8000/health', (backendRes) => {
      let data = '';
      backendRes.on('data', chunk => data += chunk);
      backendRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable' }));
    });
    return;
  }

  // Workflows - мок данные для совместимости
  if (path === '/api/workflows' && method === 'GET') {
    const workflows = [
      { id: 1, name: 'Synchronize Hub Resource types with instance', user: 'u/admin/hub_sync', description: 'Sync resource types' },
      { id: 2, name: 'New User Setup App', user: 'g/all/setup_app', description: 'Setup new users' },
      { id: 3, name: 'Lead Generation Workflow', user: 'u/admin/leads', description: 'Generate leads' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(workflows));
    return;
  }

  // Create workflow
  if (path === '/api/workflows' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newWorkflow = JSON.parse(body);
      newWorkflow.id = Date.now();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newWorkflow));
    });
    return;
  }

  // Executions - мок данные
  if (path === '/api/executions' && method === 'GET') {
    const executions = [
      { id: 1, workflowId: 1, status: 'success', started: new Date().toISOString(), duration: 1500 },
      { id: 2, workflowId: 2, status: 'running', started: new Date().toISOString(), duration: 0 },
      { id: 3, workflowId: 3, status: 'error', started: new Date().toISOString(), duration: 800 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(executions));
    return;
  }

  // Resources - мок данные
  if (path === '/api/resources' && method === 'GET') {
    const resources = [
      { id: 1, name: 'PostgreSQL Database', type: 'database', status: 'connected' },
      { id: 2, name: 'Redis Cache', type: 'cache', status: 'connected' },
      { id: 3, name: 'SMTP Server', type: 'email', status: 'disconnected' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resources));
    return;
  }

  // Create resource
  if (path === '/api/resources' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newResource = JSON.parse(body);
      newResource.id = Date.now();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newResource));
    });
    return;
  }

  // Schedules - мок данные
  if (path === '/api/schedules' && method === 'GET') {
    const schedules = [
      { id: 1, name: 'Daily Backup', path: 'f/backup_script', enabled: true, schedule: '0 2 * * *' },
      { id: 2, name: 'Weekly Report', path: 'f/report_generator', enabled: true, schedule: '0 9 * * 1' },
      { id: 3, name: 'Hourly Sync', path: 'f/data_sync', enabled: false, schedule: '0 * * * *' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(schedules));
    return;
  }

  // Create schedule
  if (path === '/api/schedules' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newSchedule = JSON.parse(body);
      newSchedule.id = Date.now();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newSchedule));
    });
    return;
  }

  // Workspace - мок данные
  if (path === '/api/workspace' && method === 'GET') {
    const workspace = {
      id: 'admins',
      name: 'Admins workspace',
      description: 'Admin workspace for system management',
      workspaceSettings: {}
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(workspace));
    return;
  }

  // Users - мок данные
  if (path === '/api/users' && method === 'GET') {
    const users = [
      { id: 1, email: 'admin@example.com', name: 'Admin User', isSuperAdmin: true },
      { id: 2, email: 'user@example.com', name: 'Regular User', isSuperAdmin: false }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8888;
proxy.listen(PORT, () => {
  console.log(`🚀 API Proxy running on http://localhost:${PORT}`);
  console.log(`🔄 Redirecting /api/health → http://localhost:8000/health`);
  console.log(`📊 Mock data for: workflows, executions, resources, schedules`);
});
