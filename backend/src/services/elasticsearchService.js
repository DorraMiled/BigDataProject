const { esClient } = require('../config/elasticsearch');
const logger = require('../utils/logger');

class ElasticsearchService {
  constructor() {
    this.client = esClient;
    this.defaultTimeout = '30s'; // 30 secondes
    this.indices = [
      'ecommerce-transactions',
      'ecommerce-errors',
      'ecommerce-fraud',
      'ecommerce-performance',
      'ecommerce-user-behavior'
    ];
  }

  /**
   * Rechercher des logs avec filtres
   * @param {Object} filters - Filtres de recherche
   * @returns {Object} Résultats de recherche
   */
  async searchLogs(filters = {}) {
    try {
      const {
        query = '*',
        index = this.indices,
        from = 0,
        size = 20,
        startDate,
        endDate,
        logType,
        status,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = filters;

      // Construction de la requête Query DSL
      const must = [];
      const filter = [];

      // Recherche texte si query fourni
      if (query && query !== '*') {
        must.push({
          multi_match: {
            query,
            fields: ['*'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Filtre par date
      if (startDate || endDate) {
        const rangeQuery = { timestamp: {} };
        if (startDate) rangeQuery.timestamp.gte = startDate;
        if (endDate) rangeQuery.timestamp.lte = endDate;
        filter.push({ range: rangeQuery });
      }

      // Filtre par statut
      if (status) {
        filter.push({ term: { status } });
      }

      // Filtre par type de log
      if (logType) {
        filter.push({ term: { log_type: logType } });
      }

      const searchBody = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        from,
        size,
        sort: [
          { [sortBy]: { order: sortOrder } }
        ],
        track_total_hits: true
      };

      const response = await this.client.search({
        index,
        body: searchBody,
        timeout: this.defaultTimeout
      });

      return {
        total: response.hits.total.value,
        hits: response.hits.hits.map(hit => ({
          id: hit._id,
          index: hit._index,
          score: hit._score,
          ...hit._source
        })),
        aggregations: response.aggregations
      };
    } catch (error) {
      logger.error(`Erreur searchLogs: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les statistiques globales
   * @returns {Object} Statistiques
   */
  async getStats() {
    try {
      const response = await this.client.search({
        index: this.indices,
        body: {
          size: 0,
          aggs: {
            total_documents: {
              value_count: { field: '_id' }
            },
            by_index: {
              terms: { 
                field: '_index',
                size: 10
              }
            },
            by_status: {
              terms: { 
                field: 'status.keyword',
                size: 10
              }
            },
            transactions_stats: {
              filter: { term: { '_index': 'ecommerce_transactions' } },
              aggs: {
                total_amount: {
                  sum: { field: 'amount' }
                },
                avg_amount: {
                  avg: { field: 'amount' }
                },
                max_amount: {
                  max: { field: 'amount' }
                },
                min_amount: {
                  min: { field: 'amount' }
                }
              }
            },
            errors_count: {
              filter: { term: { '_index': 'ecommerce_errors' } }
            },
            fraud_count: {
              filter: { term: { '_index': 'ecommerce_fraud_detection' } }
            },
            date_range: {
              stats: { field: 'timestamp' }
            }
          }
        },
        timeout: this.defaultTimeout
      });

      return {
        totalDocuments: response.hits.total.value,
        byIndex: response.aggregations.by_index.buckets,
        byStatus: response.aggregations.by_status.buckets,
        transactions: {
          total: response.aggregations.transactions_stats.total_amount.value || 0,
          average: response.aggregations.transactions_stats.avg_amount.value || 0,
          max: response.aggregations.transactions_stats.max_amount.value || 0,
          min: response.aggregations.transactions_stats.min_amount.value || 0
        },
        errorsCount: response.aggregations.errors_count.doc_count,
        fraudCount: response.aggregations.fraud_count.doc_count,
        dateRange: response.aggregations.date_range
      };
    } catch (error) {
      logger.error(`Erreur getStats: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les logs groupés par heure
   * @param {Object} options - Options de filtrage
   * @returns {Object} Logs groupés par heure
   */
  async getLogsByHour(options = {}) {
    try {
      const {
        index = this.indices,
        startDate,
        endDate,
        interval = '1h'
      } = options;

      const filter = [];

      if (startDate || endDate) {
        const rangeQuery = { timestamp: {} };
        if (startDate) rangeQuery.timestamp.gte = startDate;
        if (endDate) rangeQuery.timestamp.lte = endDate;
        filter.push({ range: rangeQuery });
      }

      const response = await this.client.search({
        index,
        body: {
          size: 0,
          query: {
            bool: { filter }
          },
          aggs: {
            logs_over_time: {
              date_histogram: {
                field: 'timestamp',
                calendar_interval: interval,
                format: 'yyyy-MM-dd HH:mm:ss',
                min_doc_count: 0
              },
              aggs: {
                by_status: {
                  terms: {
                    field: 'status.keyword',
                    size: 10
                  }
                },
                by_index: {
                  terms: {
                    field: '_index',
                    size: 10
                  }
                }
              }
            }
          }
        },
        timeout: this.defaultTimeout
      });

      return {
        interval,
        buckets: response.aggregations.logs_over_time.buckets.map(bucket => ({
          timestamp: bucket.key_as_string,
          count: bucket.doc_count,
          byStatus: bucket.by_status.buckets,
          byIndex: bucket.by_index.buckets
        }))
      };
    } catch (error) {
      logger.error(`Erreur getLogsByHour: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir un log par ID
   * @param {string} id - ID du document
   * @param {string} index - Nom de l'index (optionnel)
   * @returns {Object} Document
   */
  async getLogById(id, index = null) {
    try {
      const searchIndex = index || this.indices;

      const response = await this.client.search({
        index: searchIndex,
        body: {
          query: {
            ids: {
              values: [id]
            }
          },
          size: 1
        },
        timeout: this.defaultTimeout
      });

      if (response.hits.hits.length === 0) {
        throw new Error('Document non trouvé');
      }

      const hit = response.hits.hits[0];
      return {
        id: hit._id,
        index: hit._index,
        ...hit._source
      };
    } catch (error) {
      logger.error(`Erreur getLogById: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les top utilisateurs par activité
   * @param {Object} options - Options de recherche
   * @returns {Object} Top utilisateurs
   */
  async getTopUsers(options = {}) {
    try {
      const { size = 10, startDate, endDate } = options;

      const filter = [];
      if (startDate || endDate) {
        const rangeQuery = { timestamp: {} };
        if (startDate) rangeQuery.timestamp.gte = startDate;
        if (endDate) rangeQuery.timestamp.lte = endDate;
        filter.push({ range: rangeQuery });
      }

      const response = await this.client.search({
        index: this.indices,
        body: {
          size: 0,
          query: {
            bool: { filter }
          },
          aggs: {
            top_users: {
              terms: {
                field: 'user_id.keyword',
                size,
                order: { _count: 'desc' }
              },
              aggs: {
                total_amount: {
                  sum: { 
                    field: 'amount',
                    missing: 0
                  }
                }
              }
            }
          }
        },
        timeout: this.defaultTimeout
      });

      return response.aggregations.top_users.buckets.map(bucket => ({
        userId: bucket.key,
        activityCount: bucket.doc_count,
        totalAmount: bucket.total_amount.value
      }));
    } catch (error) {
      logger.error(`Erreur getTopUsers: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Vérifier la santé de la connexion Elasticsearch
   * @returns {Object} État de santé
   */
  async healthCheck() {
    try {
      const health = await this.client.cluster.health();
      const info = await this.client.info();

      return {
        status: health.status,
        clusterName: health.cluster_name,
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards,
        version: info.version.number
      };
    } catch (error) {
      logger.error(`Erreur healthCheck: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Gérer les erreurs Elasticsearch
   * @param {Error} error - Erreur à traiter
   * @returns {Error} Erreur formatée
   */
  handleError(error) {
    if (error.meta && error.meta.body) {
      const esError = error.meta.body.error;
      return new Error(`Elasticsearch: ${esError.type} - ${esError.reason}`);
    }

    if (error.name === 'TimeoutError') {
      return new Error('Elasticsearch: Timeout dépassé');
    }

    if (error.name === 'ConnectionError') {
      return new Error('Elasticsearch: Erreur de connexion');
    }

    return error;
  }
}

module.exports = new ElasticsearchService();
