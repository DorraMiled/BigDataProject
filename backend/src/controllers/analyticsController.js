const analyticsService = require('../services/analyticsService');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class AnalyticsController {
  async getStats(req, res, next) {
    try {
      const filters = req.query;
      const stats = await analyticsService.getTransactionStats(filters);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async searchTransactions(req, res, next) {
    try {
      const { q } = req.query;
      const { page = 1, limit = 10 } = req.query;
      
      const options = {
        from: (page - 1) * limit,
        size: parseInt(limit)
      };

      const result = await analyticsService.searchTransactions(q, options);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserBehavior(req, res, next) {
    try {
      const { userId } = req.params;
      const behavior = await analyticsService.getUserBehaviorAnalytics(userId);
      
      res.json({
        success: true,
        data: behavior
      });
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req, res, next) {
    try {
      const transaction = new Transaction(req.body);
      await transaction.save();
      
      logger.info(`Transaction créée: ${transaction.transactionId}`);
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const transactions = await Transaction.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const count = await Transaction.countDocuments();

      res.json({
        success: true,
        data: {
          transactions,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          total: count
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
