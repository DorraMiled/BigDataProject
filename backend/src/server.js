const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const logRoutes = require('./routes/logRoutes');
const { logToElk } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/logs', logRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      elasticsearch: process.env.ELASTICSEARCH_HOST,
      logstash: `http://${process.env.LOGSTASH_HOST}:${process.env.LOGSTASH_HTTP_PORT}`
    }
  });
});

// Route de test pour envoyer un log
app.post('/api/test-log', async (req, res) => {
  try {
    const testLog = {
      type: 'application',
      level: 'info',
      message: 'Test log from API',
      timestamp: new Date().toISOString(),
      ...req.body
    };
    
    await logToElk(testLog);
    res.json({ success: true, message: 'Log envoyé à Logstash', data: testLog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Logstash: http://${process.env.LOGSTASH_HOST}:${process.env.LOGSTASH_HTTP_PORT}`);
  console.log(`🔍 Elasticsearch: ${process.env.ELASTICSEARCH_HOST}`);
});

module.exports = app;
