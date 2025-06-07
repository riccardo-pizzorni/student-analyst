const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World from Student Analyst Backend! 🚀',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend is healthy',
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API endpoint working',
    data: {
      server: 'Student Analyst Backend',
      environment: 'development',
      features: ['Express', 'CORS', 'JSON parsing']
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Student Analyst Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ API test: http://localhost:${PORT}/api/test`);
}); 