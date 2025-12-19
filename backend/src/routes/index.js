const express = require('express');
const router = express.Router();
const analyticsRoutes = require('./analyticsRoutes');
const uploadRoutes = require('./uploadRoutes');
const searchRoutes = require('./searchRoutes');
const statsRoutes = require('./statsRoutes');

router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);
router.use('/search', searchRoutes);
router.use('/stats', statsRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
