const elasticsearchService = require('../services/elasticsearchService');
const SearchHistory = require('../models/SearchHistory');
const logger = require('../utils/logger');

class SearchController {
  constructor() {
    // Lier les méthodes au contexte de la classe
    this.search = this.search.bind(this);
    this.saveSearchHistory = this.saveSearchHistory.bind(this);
    this.getSearchHistory = this.getSearchHistory.bind(this);
    this.getPopularSearches = this.getPopularSearches.bind(this);
    this.getLogById = this.getLogById.bind(this);
    this.getStats = this.getStats.bind(this);
    this.getLogsByHour = this.getLogsByHour.bind(this);
  }

  async search(req, res, next) {
    const startTime = Date.now();
    
    try {
      const {
        query = '*',
        dateFrom,
        dateTo,
        level,
        service,
        logType,
        status,
        page = 1,
        size = 20,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      // Validation de la pagination
      const pageNum = Math.max(1, parseInt(page));
      const sizeNum = Math.min(100, Math.max(1, parseInt(size))); // Max 100 par page
      const from = (pageNum - 1) * sizeNum;

      // Construction des filtres pour Elasticsearch
      const filters = {
        query,
        from,
        size: sizeNum,
        sortBy,
        sortOrder
      };

      // Ajouter les filtres de date
      if (dateFrom) {
        filters.startDate = new Date(dateFrom).toISOString();
      }
      if (dateTo) {
        filters.endDate = new Date(dateTo).toISOString();
      }

      // Ajouter les filtres optionnels
      if (level) filters.level = level;
      if (service) filters.service = service;
      if (logType) filters.logType = logType;
      if (status) filters.status = status;

      // Exécuter la recherche Elasticsearch
      const results = await elasticsearchService.searchLogs(filters);

      const executionTime = Date.now() - startTime;

      // Sauvegarder l'historique de recherche en arrière-plan
      this.saveSearchHistory({
        query,
        filters: {
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo) : undefined,
          level,
          service,
          logType,
          status
        },
        pagination: {
          page: pageNum,
          size: sizeNum
        },
        resultsCount: results.total,
        executionTime,
        ipAddress: req.ip || req.connection.remoteAddress
      }).catch(err => {
        logger.error(`Erreur sauvegarde historique: ${err.message}`);
      });

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(results.total / sizeNum);

      res.json({
        success: true,
        data: {
          results: results.hits,
          total: results.total,
          pagination: {
            page: pageNum,
            size: sizeNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          },
          executionTime: `${executionTime}ms`,
          filters: {
            query,
            dateFrom,
            dateTo,
            level,
            service,
            logType,
            status
          }
        }
      });
    } catch (error) {
      logger.error(`Erreur search: ${error.message}`);
      next(error);
    }
  }

  async saveSearchHistory(data) {
    try {
      const searchHistory = new SearchHistory(data);
      await searchHistory.save();
      logger.debug(`Recherche sauvegardée: ${data.query}`);
    } catch (error) {
      // Log mais ne pas faire échouer la requête principale
      logger.error(`Erreur sauvegarde recherche: ${error.message}`);
    }
  }

  async getSearchHistory(req, res, next) {
    try {
      const { limit = 50, page = 1 } = req.query;
      
      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        SearchHistory.find()
          .sort({ searchDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-__v')
          .lean(),
        SearchHistory.countDocuments()
      ]);

      res.json({
        success: true,
        data: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPopularSearches(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      
      const popular = await SearchHistory.getPopularSearches(parseInt(limit));

      res.json({
        success: true,
        data: popular
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogById(req, res, next) {
    try {
      const { id } = req.params;
      const { index } = req.query;

      const log = await elasticsearchService.getLogById(id, index);

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await elasticsearchService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogsByHour(req, res, next) {
    try {
      const { dateFrom, dateTo, interval = '1h' } = req.query;

      const options = { interval };
      
      if (dateFrom) {
        options.startDate = new Date(dateFrom).toISOString();
      }
      if (dateTo) {
        options.endDate = new Date(dateTo).toISOString();
      }

      const data = await elasticsearchService.getLogsByHour(options);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
