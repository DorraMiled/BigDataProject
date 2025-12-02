const { ingestLogsFromFiles } = require('../services/logIngestionService');

/**
 * Script pour ingérer les logs manuellement
 * Usage: npm run ingest
 */

async function main() {
  console.log('🚀 Démarrage de l\'ingestion des logs...\n');
  console.log('='.repeat(50));
  
  try {
    const results = await ingestLogsFromFiles();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 RÉSUMÉ DE L\'INGESTION:\n');
    
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalRecords = 0;

    for (const [type, result] of Object.entries(results)) {
      console.log(`  ${type.padEnd(20)}: ${result.success}/${result.total} (${result.failed} erreurs)`);
      totalSuccess += result.success;
      totalFailed += result.failed;
      totalRecords += result.total;
    }

    console.log('\n' + '-'.repeat(50));
    console.log(`  ${'TOTAL'.padEnd(20)}: ${totalSuccess}/${totalRecords} (${totalFailed} erreurs)`);
    console.log('='.repeat(50));
    console.log('\n✅ Ingestion terminée !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'ingestion:', error);
    process.exit(1);
  }
}

main();
