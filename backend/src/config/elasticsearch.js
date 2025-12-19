const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});

const checkElasticsearchConnection = async () => {
  try {
    const health = await esClient.cluster.health();
    logger.info(`Elasticsearch connecté - Status: ${health.status}`);
  } catch (error) {
    logger.error(`Erreur Elasticsearch: ${error.message}`);
  }
};

module.exports = { esClient, checkElasticsearchConnection };
