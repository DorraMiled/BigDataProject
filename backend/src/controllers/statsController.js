const elasticsearchService = require('../services/elasticsearchService');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// Constantes
const CACHE_TTL = 60; // 60 secondes
const CACHE_KEY_DASHBOARD = 'stats:dashboard';
const CACHE_KEY_DETAILED = 'stats:detailed';

/**
 * Récupère les statistiques pour le dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Vérifier le cache Redis
    const cached = await redisClient.get(CACHE_KEY_DASHBOARD);
    
    if (cached) {
      logger.debug('Stats dashboard récupérées du cache');
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Dates pour aujourd'hui
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Requêtes Elasticsearch
    const totalResult = await elasticsearchService.client.count({
      index: elasticsearchService.indices
    });

    const todayResult = await elasticsearchService.client.count({
      index: elasticsearchService.indices,
      body: {
        query: {
          range: {
            timestamp: {
              gte: startOfToday.toISOString(),
              lte: endOfToday.toISOString()
            }
          }
        }
      }
    });

    const errorResult = await elasticsearchService.client.count({
      index: elasticsearchService.indices,
      body: {
        query: {
          bool: {
            must: [
              {
                range: {
                  timestamp: {
                    gte: startOfToday.toISOString(),
                    lte: endOfToday.toISOString()
                  }
                }
              },
              {
                term: {
                  'level.keyword': 'ERROR'
                }
              }
            ]
          }
        }
      }
    });

    // Distribution par type
    const typeDistribution = await elasticsearchService.client.search({
      index: elasticsearchService.indices,
      body: {
        size: 0,
        aggs: {
          types: {
            terms: {
              field: 'logType.keyword',
              size: 10
            }
          }
        }
      }
    });

    // Stats par heure
    const hourlyStats = await elasticsearchService.client.search({
      index: elasticsearchService.indices,
      body: {
        size: 0,
        query: {
          range: {
            timestamp: {
              gte: 'now-24h',
              lte: 'now'
            }
          }
        },
        aggs: {
          logs_per_hour: {
            date_histogram: {
              field: 'timestamp',
              fixed_interval: '1h',
              format: 'HH:mm'
            }
          }
        }
      }
    });

    const statsData = {
      totalLogs: totalResult.count,
      logsToday: todayResult.count,
      errorsToday: errorResult.count,
      logTypeDistribution: typeDistribution.aggregations.types.buckets.map(b => ({
        type: b.key,
        count: b.doc_count
      })),
      logsByHour: hourlyStats.aggregations.logs_per_hour.buckets.map(b => ({
        hour: b.key_as_string,
        count: b.doc_count
      }))
    };

    // Mettre en cache
    await redisClient.set(
      CACHE_KEY_DASHBOARD,
      JSON.stringify(statsData),
      'EX',
      CACHE_TTL
    );
    
    logger.debug(`Stats dashboard mises en cache pour ${CACHE_TTL}s`);

    res.json({
      success: true,
      data: statsData,
      cached: false
    });
  } catch (error) {
    logger.error(`Erreur getDashboardStats: ${error.message}`);
    next(error);
  }
};

/**
 * Récupère les statistiques détaillées
 */
const getDetailedStats = async (req, res, next) => {
  try {
    // Vérifier le cache Redis
    const cached = await redisClient.get(CACHE_KEY_DETAILED);
    
    if (cached) {
      logger.debug('Stats détaillées récupérées du cache');
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const { startDate, endDate } = req.query;
    
    // Validation des dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Dates invalides'
      });
    }

    // Requêtes Elasticsearch
    const totalResult = await elasticsearchService.client.count({
      index: elasticsearchService.indices,
      body: {
        query: {
          range: {
            timestamp: {
              gte: start.toISOString(),
              lte: end.toISOString()
            }
          }
        }
      }
    });

    const errorResult = await elasticsearchService.client.count({
      index: elasticsearchService.indices,
      body: {
        query: {
          bool: {
            must: [
              {
                range: {
                  timestamp: {
                    gte: start.toISOString(),
                    lte: end.toISOString()
                  }
                }
              },
              {
                term: {
                  'level.keyword': 'ERROR'
                }
              }
            ]
          }
        }
      }
    });

    // Distribution par niveau
    const levelDistribution = await elasticsearchService.client.search({
      index: elasticsearchService.indices,
      body: {
        size: 0,
        query: {
          range: {
            timestamp: {
              gte: start.toISOString(),
              lte: end.toISOString()
            }
          }
        },
        aggs: {
          levels: {
            terms: {
              field: 'level.keyword',
              size: 10
            }
          }
        }
      }
    });

    // Distribution par type
    const typeDistribution = await elasticsearchService.client.search({
      index: elasticsearchService.indices,
      body: {
        size: 0,
        query: {
          range: {
            timestamp: {
              gte: start.toISOString(),
              lte: end.toISOString()
            }
          }
        },
        aggs: {
          types: {
            terms: {
              field: 'logType.keyword',
              size: 10
            }
          }
        }
      }
    });

    // Top utilisateurs
    const topUsers = await elasticsearchService.client.search({
      index: elasticsearchService.indices,
      body: {
        size: 0,
        query: {
          range: {
            timestamp: {
              gte: start.toISOString(),
              lte: end.toISOString()
            }
          }
        },
        aggs: {
          top_users: {
            terms: {
              field: 'userId.keyword',
              size: 10
            }
          }
        }
      }
    });

    // Stats par jour
    const dailyStats = await elasticsearchService.client.search({
      index: elasticsearchService.indices,
      body: {
        size: 0,
        query: {
          range: {
            timestamp: {
              gte: start.toISOString(),
              lte: end.toISOString()
            }
          }
        },
        aggs: {
          logs_per_day: {
            date_histogram: {
              field: 'timestamp',
              fixed_interval: '1d',
              format: 'yyyy-MM-dd'
            }
          }
        }
      }
    });

    const statsData = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      totalLogs: totalResult.count,
      totalErrors: errorResult.count,
      errorRate: totalResult.count > 0 ? (errorResult.count / totalResult.count * 100).toFixed(2) : 0,
      levelDistribution: levelDistribution.aggregations.levels.buckets.map(b => ({
        level: b.key,
        count: b.doc_count
      })),
      logTypeDistribution: typeDistribution.aggregations.types.buckets.map(b => ({
        type: b.key,
        count: b.doc_count
      })),
      topUsers: topUsers.aggregations.top_users.buckets.map(b => ({
        userId: b.key,
        count: b.doc_count
      })),
      logsByDay: dailyStats.aggregations.logs_per_day.buckets.map(b => ({
        date: b.key_as_string,
        count: b.doc_count
      }))
    };

    // Mettre en cache
    await redisClient.set(
      CACHE_KEY_DETAILED,
      JSON.stringify(statsData),
      'EX',
      CACHE_TTL
    );
    
    logger.debug(`Stats détaillées mises en cache pour ${CACHE_TTL}s`);

    res.json({
      success: true,
      data: statsData,
      cached: false
    });
  } catch (error) {
    logger.error(`Erreur getDetailedStats: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDetailedStats
};
