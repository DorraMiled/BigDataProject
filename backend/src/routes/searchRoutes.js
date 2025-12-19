const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search - Recherche dans les logs
router.get('/', searchController.search);

// GET /api/search/history - Historique des recherches
router.get('/history', searchController.getSearchHistory);

// GET /api/search/popular - Recherches populaires
router.get('/popular', searchController.getPopularSearches);

// GET /api/search/stats - Statistiques Elasticsearch
router.get('/stats', searchController.getStats);

// GET /api/search/timeline - Logs groupés par heure
router.get('/timeline', searchController.getLogsByHour);

// GET /api/search/log/:id - Détails d'un log par ID
router.get('/log/:id', searchController.getLogById);

module.exports = router;
