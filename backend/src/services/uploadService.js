const path = require('path');
const fs = require('fs').promises;
const FileUpload = require('../models/FileUpload');
const logger = require('../utils/logger');

class UploadService {
  constructor() {
    // Dossier surveillé par Logstash
    this.uploadDir = path.join(__dirname, '../../../ecommerce_logs');
    this.maxFileSize = 100 * 1024 * 1024; // 50MB
    this.allowedExtensions = ['.csv', '.ndjson', '.json'];
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`Dossier créé: ${this.uploadDir}`);
    }
  }

  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('Aucun fichier fourni');
      return { valid: false, errors };
    }

    // Vérifier l'extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      errors.push(`Extension non autorisée. Extensions acceptées: ${this.allowedExtensions.join(', ')}`);
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      errors.push(`Fichier trop volumineux. Taille max: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    return {
      valid: errors.length === 0,
      errors,
      fileType: ext.substring(1)
    };
  }

  detectLogType(filename) {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('transaction')) return 'transaction';
    if (lowerName.includes('error')) return 'error';
    if (lowerName.includes('fraud')) return 'fraud';
    if (lowerName.includes('performance')) return 'performance';
    if (lowerName.includes('behavior') || lowerName.includes('behaviour')) return 'behavior';
    
    // Par défaut
    return 'transaction';
  }

  async saveFile(file) {
    try {
      await this.ensureUploadDirectory();

      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Générer un nom de fichier unique avec timestamp
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const newFilename = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(this.uploadDir, newFilename);

      // Sauvegarder le fichier
      await fs.writeFile(filePath, file.buffer);
      logger.info(`Fichier sauvegardé: ${filePath}`);

      // Détecter le type de log
      const logType = this.detectLogType(file.originalname);

      // Créer l'enregistrement MongoDB
      const fileUpload = new FileUpload({
        filename: newFilename,
        fileType: validation.fileType,
        size: file.size,
        uploadDate: new Date(),
        status: 'pending',
        logType: logType,
        documentCount: 0
      });

      await fileUpload.save();
      logger.info(`Métadonnées enregistrées: ${fileUpload._id}`);

      return {
        success: true,
        data: {
          id: fileUpload._id,
          filename: newFilename,
          originalName: file.originalname,
          size: file.size,
          fileType: validation.fileType,
          logType: logType,
          status: fileUpload.status,
          uploadDate: fileUpload.uploadDate,
          path: filePath
        }
      };
    } catch (error) {
      logger.error(`Erreur saveFile: ${error.message}`);
      throw error;
    }
  }

  async getUploadHistory(filters = {}) {
    try {
      const query = {};
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.logType) {
        query.logType = filters.logType;
      }

      const uploads = await FileUpload.find(query)
        .sort({ uploadDate: -1 })
        .limit(filters.limit || 50);

      return uploads;
    } catch (error) {
      logger.error(`Erreur getUploadHistory: ${error.message}`);
      throw error;
    }
  }

  async getUploadById(id) {
    try {
      const upload = await FileUpload.findById(id);
      if (!upload) {
        throw new Error('Upload non trouvé');
      }
      return upload;
    } catch (error) {
      logger.error(`Erreur getUploadById: ${error.message}`);
      throw error;
    }
  }

  async getFilesList(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        logType,
        sortBy = 'uploadDate',
        sortOrder = 'desc'
      } = options;

      // Construction de la requête
      const query = {};
      if (status) query.status = status;
      if (logType) query.logType = logType;

      // Calcul de la pagination
      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Récupération des données
      const [files, total] = await Promise.all([
        FileUpload.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-__v')
          .lean(),
        FileUpload.countDocuments(query)
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        files,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      logger.error(`Erreur getFilesList: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UploadService();
