const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 8005;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'jarilo-proxy' });
});

// Jarilo API Proxy
app.post('/api/v1/tasks', async (req, res) => {
  try {
    console.log('🔗 Proxying request to Jarilo:', req.body);
    
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:8004/api/v1/tasks',
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Jarilo response:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Jarilo proxy error:', error.message);
    res.status(500).json({ 
      error: 'Jarilo AI сервис недоступен. Убедитесь что Jarilo запущен на порту 8004',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jarilo Proxy Server started on http://localhost:${PORT}`);
  console.log(`📡 Proxying /api/v1/tasks to http://localhost:8004/api/v1/tasks`);
});
