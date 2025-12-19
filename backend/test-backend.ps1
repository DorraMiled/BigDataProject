# Script de test du backend
# Exécuter avec: .\test-backend.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST DU BACKEND E-COMMERCE ANALYTICS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Couleurs
$success = "Green"
$error = "Red"
$info = "Yellow"

# 1. Vérifier les services Docker
Write-Host "1. Vérification des services Docker..." -ForegroundColor $info
$containers = @("mongodb", "ecommerce-redis", "elasticsearch")
$allRunning = $true

foreach ($container in $containers) {
    $status = docker ps --filter "name=$container" --format "{{.Status}}"
    if ($status) {
        Write-Host "   ✓ $container : Running" -ForegroundColor $success
    } else {
        Write-Host "   ✗ $container : Stopped" -ForegroundColor $error
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host "`n⚠ Certains conteneurs ne sont pas démarrés!" -ForegroundColor $error
    Write-Host "Lancer: docker-compose up -d`n" -ForegroundColor $info
    exit 1
}

# 2. Vérifier les connexions
Write-Host "`n2. Test des connexions..." -ForegroundColor $info

# MongoDB
try {
    $mongoTest = docker exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.adminCommand('ping')" 2>&1
    if ($mongoTest -match "ok.*1") {
        Write-Host "   ✓ MongoDB : Connecté" -ForegroundColor $success
    } else {
        Write-Host "   ✗ MongoDB : Erreur" -ForegroundColor $error
    }
} catch {
    Write-Host "   ✗ MongoDB : Erreur de connexion" -ForegroundColor $error
}

# Redis
try {
    $redisTest = docker exec ecommerce-redis redis-cli ping 2>&1
    if ($redisTest -match "PONG") {
        Write-Host "   ✓ Redis : Connecté" -ForegroundColor $success
    } else {
        Write-Host "   ✗ Redis : Erreur" -ForegroundColor $error
    }
} catch {
    Write-Host "   ✗ Redis : Erreur de connexion" -ForegroundColor $error
}

# Elasticsearch
try {
    $esTest = Invoke-RestMethod -Uri "http://localhost:9200/_cluster/health" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Elasticsearch : Connecté (Status: $($esTest.status))" -ForegroundColor $success
} catch {
    Write-Host "   ✗ Elasticsearch : Erreur de connexion" -ForegroundColor $error
}

# 3. Vérifier que le serveur Node n'est pas déjà lancé
Write-Host "`n3. Vérification du port 3001..." -ForegroundColor $info
$nodeProcess = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "   ⚠ Processus Node.js détecté. Arrêt..." -ForegroundColor $info
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

$portTest = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue
if ($portTest.TcpTestSucceeded) {
    Write-Host "   ⚠ Port 3001 déjà utilisé" -ForegroundColor $error
    exit 1
} else {
    Write-Host "   ✓ Port 3001 disponible" -ForegroundColor $success
}

# 4. Démarrer le serveur backend dans un nouveau terminal
Write-Host "`n4. Démarrage du serveur backend..." -ForegroundColor $info
Write-Host "   Lancement dans 3 secondes..." -ForegroundColor $info

# Créer un script temporaire pour lancer le serveur
$startScript = @"
cd 'C:\Users\DELL\Desktop\3eme\Big Data\ECommerceBigData\backend'
npm run dev
"@

$startScript | Out-File -FilePath ".\start-backend.ps1" -Encoding UTF8

# Lancer dans un nouveau terminal
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\start-backend.ps1"

Write-Host "   Attente du démarrage (10 secondes)..." -ForegroundColor $info
Start-Sleep -Seconds 10

# 5. Tester les endpoints
Write-Host "`n5. Test des endpoints API..." -ForegroundColor $info

$endpoints = @(
    @{ Name = "Health"; Url = "http://localhost:3001/api/health"; Method = "GET" },
    @{ Name = "Stats"; Url = "http://localhost:3001/api/stats"; Method = "GET" },
    @{ Name = "Search"; Url = "http://localhost:3001/api/search?query=*&size=1"; Method = "GET" }
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method $endpoint.Method -ErrorAction Stop
        if ($response.success) {
            Write-Host "   ✓ $($endpoint.Name) : OK" -ForegroundColor $success
        } else {
            Write-Host "   ✗ $($endpoint.Name) : Réponse invalide" -ForegroundColor $error
        }
    } catch {
        Write-Host "   ✗ $($endpoint.Name) : Erreur - $($_.Exception.Message)" -ForegroundColor $error
    }
}

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTS TERMINÉS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nCommandes utiles:" -ForegroundColor $info
Write-Host "  • Arrêter le serveur : Ctrl+C dans le terminal du serveur" -ForegroundColor White
Write-Host "  • Voir les logs : Dans le terminal du serveur" -ForegroundColor White
Write-Host "  • Tester manuellement : Invoke-RestMethod -Uri http://localhost:3001/api/health" -ForegroundColor White
Write-Host "  • Ouvrir Kibana : http://localhost:5601" -ForegroundColor White
Write-Host ""
