const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// GET /api/stats - Statistiques dashboard (formaté pour Chart.js)
router.get('/', statsController.getDashboardStats);

// GET /api/stats/detailed - Statistiques détaillées
router.get('/detailed', statsController.getDetailedStats);

module.exports = router;
