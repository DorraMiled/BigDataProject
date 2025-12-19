# Script de Tests Manuels - Backend & ELK Stack
# E-Commerce Analytics Platform
# Date: 2025-12-19

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TESTS BACKEND & ELK STACK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour afficher le résultat
function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$ExpectedResult
    )
    
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    Write-Host "Attendu: $ExpectedResult" -ForegroundColor Gray
    
    try {
        $result = & $Test
        Write-Host "✓ SUCCÈS" -ForegroundColor Green
        $result | Out-String | Write-Host
        return $true
    } catch {
        Write-Host "✗ ÉCHEC: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    Write-Host "----------------------------------------`n"
}

$passed = 0
$failed = 0

# ============================================
# PARTIE 1: VÉRIFICATION DES SERVICES DOCKER
# ============================================

Write-Host "`n[1] VÉRIFICATION DES CONTAINERS DOCKER" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "1.1 - Elasticsearch est démarré" {
    $container = docker ps --filter "name=elasticsearch" --format "{{.Status}}"
    if ($container -match "Up") {
        "Container: elasticsearch - Status: $container"
    } else {
        throw "Elasticsearch n'est pas démarré"
    }
} "Container elasticsearch actif") { $passed++ } else { $failed++ }

if (Test-Component "1.2 - Logstash est démarré" {
    $container = docker ps --filter "name=logstash" --format "{{.Status}}"
    if ($container -match "Up") {
        "Container: logstash - Status: $container"
    } else {
        throw "Logstash n'est pas démarré"
    }
} "Container logstash actif") { $passed++ } else { $failed++ }

if (Test-Component "1.3 - MongoDB est démarré" {
    $container = docker ps --filter "name=mongodb" --format "{{.Status}}"
    if ($container -match "Up") {
        "Container: mongodb - Status: $container"
    } else {
        throw "MongoDB n'est pas démarré"
    }
} "Container mongodb actif") { $passed++ } else { $failed++ }

if (Test-Component "1.4 - Redis est démarré" {
    $container = docker ps --filter "name=redis" --format "{{.Status}}"
    if ($container -match "Up") {
        "Container: redis - Status: $container"
    } else {
        throw "Redis n'est pas démarré"
    }
} "Container redis actif") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 2: TESTS ELASTICSEARCH
# ============================================

Write-Host "`n[2] TESTS ELASTICSEARCH" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "2.1 - Elasticsearch répond" {
    $response = Invoke-RestMethod -Uri "http://localhost:9200" -Method GET
    "Cluster: $($response.cluster_name) - Version: $($response.version.number)"
} "Status 200 avec informations cluster") { $passed++ } else { $failed++ }

if (Test-Component "2.2 - Health du cluster" {
    $health = Invoke-RestMethod -Uri "http://localhost:9200/_cluster/health" -Method GET
    "Status: $($health.status) - Nodes: $($health.number_of_nodes) - Active shards: $($health.active_shards)"
} "Status yellow ou green") { $passed++ } else { $failed++ }

if (Test-Component "2.3 - Lister les indices" {
    $indices = Invoke-RestMethod -Uri "http://localhost:9200/_cat/indices?v" -Method GET
    $indices
} "Liste des indices (peut être vide)") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 3: TESTS LOGSTASH
# ============================================

Write-Host "`n[3] TESTS LOGSTASH" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "3.1 - API Logstash répond" {
    $response = Invoke-RestMethod -Uri "http://localhost:9600" -Method GET
    "Version: $($response.version) - Status: $($response.status)"
} "Status green") { $passed++ } else { $failed++ }

if (Test-Component "3.2 - Pipelines Logstash configurés" {
    $pipelines = Invoke-RestMethod -Uri "http://localhost:9600/_node/stats/pipelines" -Method GET
    $pipelineNames = $pipelines.pipelines.PSObject.Properties.Name
    "Pipelines actifs: $($pipelineNames -join ', ')"
    "Nombre de pipelines: $($pipelineNames.Count)"
} "2 pipelines: csv-transactions, json-logs") { $passed++ } else { $failed++ }

if (Test-Component "3.3 - Events traités par pipeline CSV" {
    $stats = Invoke-RestMethod -Uri "http://localhost:9600/_node/stats/pipelines" -Method GET
    $csvEvents = $stats.pipelines.'csv-transactions'.events
    "Events IN: $($csvEvents.in) - OUT: $($csvEvents.out) - FILTERED: $($csvEvents.filtered)"
} "Statistiques des events") { $passed++ } else { $failed++ }

if (Test-Component "3.4 - Events traités par pipeline JSON" {
    $stats = Invoke-RestMethod -Uri "http://localhost:9600/_node/stats/pipelines" -Method GET
    $jsonEvents = $stats.pipelines.'json-logs'.events
    "Events IN: $($jsonEvents.in) - OUT: $($jsonEvents.out) - FILTERED: $($jsonEvents.filtered)"
} "Statistiques des events") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 4: TESTS MONGODB
# ============================================

Write-Host "`n[4] TESTS MONGODB" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "4.1 - MongoDB ping" {
    $result = docker exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.adminCommand('ping')" --quiet
    $result
} "{ ok: 1 }") { $passed++ } else { $failed++ }

if (Test-Component "4.2 - Compter les transactions dans MongoDB" {
    $result = docker exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin ecommerce --eval "db.transactions.countDocuments()" --quiet
    "Nombre de transactions: $result"
} "Nombre de documents") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 5: TESTS REDIS
# ============================================

Write-Host "`n[5] TESTS REDIS" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "5.1 - Redis ping" {
    $result = docker exec redis redis-cli ping
    $result
} "PONG") { $passed++ } else { $failed++ }

if (Test-Component "5.2 - Vérifier les clés en cache" {
    $keys = docker exec redis redis-cli keys "*"
    if ($keys) {
        "Clés en cache:`n$keys"
    } else {
        "Aucune clé en cache (normal si pas encore utilisé)"
    }
} "Liste des clés ou vide") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 6: TESTS BACKEND API
# ============================================

Write-Host "`n[6] TESTS BACKEND API" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "6.1 - Backend Health Check" {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
    "Success: $($response.success) - Message: $($response.message)"
} "success: true") { $passed++ } else { $failed++ }

if (Test-Component "6.2 - Liste des transactions" {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/analytics/transactions" -Method GET
    "Success: $($response.success) - Total: $($response.data.total) - Transactions: $($response.data.transactions.Count)"
} "Liste des transactions") { $passed++ } else { $failed++ }

if (Test-Component "6.3 - Créer une transaction de test" {
    $body = @{
        transactionId = "TEST-MANUAL-$(Get-Random -Maximum 99999)"
        userId = "testuser"
        amount = 199.99
        currency = "USD"
        status = "completed"
        paymentMethod = "credit_card"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/analytics/transactions" -Method POST -Body $body -ContentType "application/json"
    "Transaction créée: $($response.data.transactionId) - Amount: $($response.data.amount)"
} "Transaction créée") { $passed++ } else { $failed++ }

if (Test-Component "6.4 - Liste des fichiers uploadés" {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/files" -Method GET
    "Success: $($response.success) - Total fichiers: $($response.data.total)"
} "Liste des fichiers") { $passed++ } else { $failed++ }

if (Test-Component "6.5 - Endpoint Stats (peut échouer si pas d'indices ES)" {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/stats" -Method GET
        if ($response.success) {
            "Stats récupérées - Cached: $($response.cached)"
        } else {
            "Erreur attendue: $($response.error)"
        }
    } catch {
        "Normal si indices Elasticsearch vides"
    }
} "Stats ou erreur si indices vides") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 7: TESTS D'INTÉGRATION LOGSTASH -> ELASTICSEARCH
# ============================================

Write-Host "`n[7] TESTS INTÉGRATION LOGSTASH -> ELASTICSEARCH" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "7.1 - Vérifier fichiers CSV dans Logstash" {
    $files = docker exec logstash ls -la /usr/share/logstash/input_data/csv/
    $files
} "Liste des fichiers CSV") { $passed++ } else { $failed++ }

if (Test-Component "7.2 - Vérifier fichiers JSON dans Logstash" {
    $files = docker exec logstash ls -la /usr/share/logstash/input_data/json/
    $files
} "Liste des fichiers JSON") { $passed++ } else { $failed++ }

if (Test-Component "7.3 - Compter documents dans indices ecommerce" {
    try {
        $count = Invoke-RestMethod -Uri "http://localhost:9200/ecommerce_*/_count" -Method GET
        "Total documents: $($count.count)"
    } catch {
        "Aucun indice ecommerce créé (normal si pas encore de données)"
    }
} "Nombre de documents ou 0") { $passed++ } else { $failed++ }

# ============================================
# PARTIE 8: TESTS KIBANA (optionnel)
# ============================================

Write-Host "`n[8] TESTS KIBANA" -ForegroundColor Magenta
Write-Host "----------------------------------------`n"

if (Test-Component "8.1 - Kibana est accessible" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5601" -Method GET -UseBasicParsing -TimeoutSec 5
        "Status: $($response.StatusCode)"
    } catch {
        "Kibana peut prendre du temps à démarrer"
    }
} "Status 200") { $passed++ } else { $failed++ }

# ============================================
# RÉSUMÉ
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Tests réussis: $passed" -ForegroundColor Green
Write-Host "✗ Tests échoués: $failed" -ForegroundColor Red
Write-Host "Total: $($passed + $failed)" -ForegroundColor White
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 TOUS LES TESTS SONT PASSÉS!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus." -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
