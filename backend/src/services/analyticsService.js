const { esClient } = require('../config/elasticsearch');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class AnalyticsService {
  async getTransactionStats(filters = {}) {
    try {
      const cacheKey = `stats:transactions:${JSON.stringify(filters)}`;
      
      // Vérifier le cache Redis
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Stats récupérées du cache');
        return JSON.parse(cached);
      }

      // Query Elasticsearch
      const result = await esClient.search({
        index: 'ecommerce_transactions',
        body: {
          size: 0,
          aggs: {
            total_amount: { sum: { field: 'amount' } },
            avg_amount: { avg: { field: 'amount' } },
            transaction_count: { value_count: { field: 'transaction_id.keyword' } }
          }
        }
      });

      const stats = {
        totalAmount: result.aggregations.total_amount.value,
        avgAmount: result.aggregations.avg_amount.value,
        count: result.aggregations.transaction_count.value
      };

      // Mettre en cache pour 5 minutes
      await redisClient.setex(cacheKey, 300, JSON.stringify(stats));

      return stats;
    } catch (error) {
      logger.error(`Erreur getTransactionStats: ${error.message}`);
      throw error;
    }
  }

  async searchTransactions(query, options = {}) {
    try {
      const { from = 0, size = 10 } = options;

      const result = await esClient.search({
        index: 'ecommerce_transactions',
        body: {
          from,
          size,
          query: {
            multi_match: {
              query,
              fields: ['transaction_id', 'user_id', 'status']
            }
          },
          sort: [{ timestamp: { order: 'desc' } }]
        }
      });

      return {
        total: result.hits.total.value,
        transactions: result.hits.hits.map(hit => hit._source)
      };
    } catch (error) {
      logger.error(`Erreur searchTransactions: ${error.message}`);
      throw error;
    }
  }

  async getUserBehaviorAnalytics(userId) {
    try {
      const cacheKey = `user:behavior:${userId}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const result = await esClient.search({
        index: 'ecommerce_user_behavior',
        body: {
          query: {
            match: { user_id: userId }
          },
          size: 100,
          sort: [{ timestamp: { order: 'desc' } }]
        }
      });

      const behavior = {
        userId,
        activities: result.hits.hits.map(hit => hit._source),
        totalActivities: result.hits.total.value
      };

      await redisClient.setex(cacheKey, 600, JSON.stringify(behavior));

      return behavior;
    } catch (error) {
      logger.error(`Erreur getUserBehaviorAnalytics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
