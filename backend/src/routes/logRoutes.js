const express = require('express');
const router = express.Router();
const { ingestLogsFromFiles } = require('../services/logIngestionService');
const { logToElk, logBatchToElk } = require('../utils/logger');

/**
 * POST /api/logs/ingest
 * Ingérer tous les fichiers de logs dans Elasticsearch
 */
router.post('/ingest', async (req, res) => {
  try {
    console.log('🚀 Début de l\'ingestion des logs...');
    const result = await ingestLogsFromFiles();
    res.json({
      success: true,
      message: 'Ingestion terminée',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ingestion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/logs/ingest/:type
 * Ingérer un type spécifique de logs (transactions, errors, fraud, etc.)
 */
router.post('/ingest/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['transactions', 'errors', 'fraud', 'performance', 'user_behavior'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Type invalide. Types valides: ${validTypes.join(', ')}`
      });
    }

    console.log(`🚀 Ingestion des logs: ${type}`);
    const result = await ingestLogsFromFiles(type);
    
    res.json({
      success: true,
      message: `Ingestion de ${type} terminée`,
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ingestion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/logs/send
 * Envoyer un log personnalisé
 */
router.post('/send', async (req, res) => {
  try {
    const logData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString()
    };

    await logToElk(logData);
    
    res.json({
      success: true,
      message: 'Log envoyé avec succès',
      data: logData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/logs/batch
 * Envoyer plusieurs logs en batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "logs" doit être un tableau'
      });
    }

    const result = await logBatchToElk(logs);
    
    res.json({
      success: true,
      message: 'Batch traité',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
