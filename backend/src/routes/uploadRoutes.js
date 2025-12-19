const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../middlewares/upload');

// POST /api/upload - Upload un fichier
router.post('/', uploadMiddleware.single('file'), uploadController.uploadFile);

// GET /api/upload/files - Liste paginée des fichiers
router.get('/files', uploadController.getFilesList);

// GET /api/upload/history - Historique des uploads
router.get('/history', uploadController.getUploadHistory);

// GET /api/upload/:id - Détails d'un upload
router.get('/:id', uploadController.getUploadById);

module.exports = router;
