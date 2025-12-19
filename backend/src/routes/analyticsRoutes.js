const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/stats - Statistiques générales
router.get('/stats', analyticsController.getStats);

// GET /api/analytics/search?q=query - Recherche de transactions
router.get('/search', analyticsController.searchTransactions);

// GET /api/analytics/user/:userId - Comportement utilisateur
router.get('/user/:userId', analyticsController.getUserBehavior);

// GET /api/analytics/transactions - Liste des transactions
router.get('/transactions', analyticsController.getTransactions);

// POST /api/analytics/transactions - Créer une transaction
router.post('/transactions', analyticsController.createTransaction);

module.exports = router;
