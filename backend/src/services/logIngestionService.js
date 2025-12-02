const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { logToElk } = require('../utils/logger');

const LOGS_DIR = process.env.LOGS_DIR || '/app/logs';

/**
 * Lire et parser un fichier JSON
 */
async function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error(`Erreur lecture JSON ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Lire et parser un fichier CSV
 */
async function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Envoyer les logs à Logstash
 */
async function sendLogsToLogstash(logs, type) {
  let successCount = 0;
  let errorCount = 0;

  for (const log of logs) {
    try {
      const logData = {
        ...log,
        type: type,
        timestamp: log.timestamp || new Date().toISOString(),
        source: 'api-ingestion'
      };

      await logToElk(logData);
      successCount++;

      // Log progress every 100 records
      if (successCount % 100 === 0) {
        console.log(`  ✓ ${successCount}/${logs.length} logs envoyés...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Erreur envoi log:`, error.message);
    }
  }

  return { total: logs.length, success: successCount, failed: errorCount };
}

/**
 * Ingérer tous les fichiers de logs ou un type spécifique
 */
async function ingestLogsFromFiles(specificType = null) {
  const results = {};
  
  const logTypes = specificType 
    ? [specificType] 
    : ['transactions', 'errors', 'fraud', 'performance', 'user_behavior'];

  for (const type of logTypes) {
    console.log(`\n📂 Traitement: ${type}`);
    
    const jsonPath = path.join(LOGS_DIR, `${type}.json`);
    const csvPath = path.join(LOGS_DIR, `${type}.csv`);
    
    let allLogs = [];

    // Lire JSON
    if (fs.existsSync(jsonPath)) {
      console.log(`  📄 Lecture ${type}.json...`);
      const jsonLogs = await readJsonFile(jsonPath);
      allLogs = allLogs.concat(jsonLogs);
      console.log(`  ✓ ${jsonLogs.length} enregistrements JSON lus`);
    }

    // Lire CSV
    if (fs.existsSync(csvPath)) {
      console.log(`  📄 Lecture ${type}.csv...`);
      const csvLogs = await readCsvFile(csvPath);
      allLogs = allLogs.concat(csvLogs);
      console.log(`  ✓ ${csvLogs.length} enregistrements CSV lus`);
    }

    if (allLogs.length > 0) {
      console.log(`  📤 Envoi de ${allLogs.length} logs à Logstash...`);
      const result = await sendLogsToLogstash(allLogs, type);
      results[type] = result;
      console.log(`  ✅ ${type}: ${result.success}/${result.total} envoyés (${result.failed} erreurs)`);
    } else {
      console.log(`  ⚠️  Aucun fichier trouvé pour ${type}`);
      results[type] = { total: 0, success: 0, failed: 0 };
    }
  }

  return results;
}

module.exports = {
  ingestLogsFromFiles,
  readJsonFile,
  readCsvFile
};
