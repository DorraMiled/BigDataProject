const uploadService = require('../services/uploadService');
const logger = require('../utils/logger');

class UploadController {
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni'
        });
      }

      const result = await uploadService.saveFile(req.file);

      res.status(201).json({
        success: true,
        message: 'Fichier uploadé avec succès',
        data: result.data
      });
    } catch (error) {
      logger.error(`Erreur upload: ${error.message}`);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUploadHistory(req, res, next) {
    try {
      const { status, logType, limit } = req.query;
      
      const filters = {
        ...(status && { status }),
        ...(logType && { logType }),
        ...(limit && { limit: parseInt(limit) })
      };

      const uploads = await uploadService.getUploadHistory(filters);

      res.json({
        success: true,
        count: uploads.length,
        data: uploads
      });
    } catch (error) {
      next(error);
    }
  }

  async getUploadById(req, res, next) {
    try {
      const { id } = req.params;
      const upload = await uploadService.getUploadById(id);

      res.json({
        success: true,
        data: upload
      });
    } catch (error) {
      next(error);
    }
  }

  async getFilesList(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        logType,
        sortBy = 'uploadDate',
        sortOrder = 'desc'
      } = req.query;

      const result = await uploadService.getFilesList({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        logType,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();
