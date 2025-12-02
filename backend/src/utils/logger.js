const axios = require('axios');

const LOGSTASH_URL = `http://${process.env.LOGSTASH_HOST || 'logstash'}:${process.env.LOGSTASH_HTTP_PORT || '8080'}`;

/**
 * Envoyer un log à Logstash via HTTP
 */
async function logToElk(data) {
  try {
    const response = await axios.post(LOGSTASH_URL, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi à Logstash:', error.message);
    throw error;
  }
}

/**
 * Envoyer plusieurs logs en batch
 */
async function logBatchToElk(logsArray) {
  const results = [];
  const errors = [];

  for (const log of logsArray) {
    try {
      await logToElk(log);
      results.push({ success: true, log });
    } catch (error) {
      errors.push({ success: false, log, error: error.message });
    }
  }

  return {
    total: logsArray.length,
    success: results.length,
    failed: errors.length,
    errors: errors.slice(0, 5) // Retourner seulement les 5 premières erreurs
  };
}

module.exports = {
  logToElk,
  logBatchToElk
};
