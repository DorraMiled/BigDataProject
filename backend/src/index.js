require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/mongodb');
const { checkElasticsearchConnection } = require('./config/elasticsearch');
const redisClient = require('./config/redis');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Error handler (doit être après les routes)
app.use(errorHandler);

// Initialisation des connexions
const startServer = async () => {
  try {
    // Connexion MongoDB
    await connectDB();
    
    // Vérification Elasticsearch
    await checkElasticsearchConnection();
    
    // Redis est déjà connecté via require
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV}`);
    });

    server.on('error', (error) => {
      logger.error(`Erreur serveur: ${error.message}`);
      logger.error(error.stack);
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error(`Erreur au démarrage: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, fermeture gracieuse...');
  await redisClient.quit();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error(`Erreur non capturée: ${error.message}`);
  logger.error(error.stack);
  // process.exit(1); // Temporairement désactivé pour debug
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Promise rejetée non gérée: ${reason}`);
  logger.error(reason);
  // process.exit(1); // Temporairement désactivé pour debug
});

startServer();

module.exports = app;
