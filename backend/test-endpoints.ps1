# Script de test des endpoints du backend
# Ce script teste tous les endpoints principaux de l'API

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Test des Endpoints Backend" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour afficher le résultat d'un test
function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    Write-Host "Test: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url"
    Write-Host "Méthode: $Method"
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -UseBasicParsing
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body ($Body | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
        }
        
        Write-Host "✓ Succès" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 2 | Write-Host
    } catch {
        Write-Host "✗ Échec: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "------------------------------------"
    Write-Host ""
}

# Base URL
$BaseUrl = "http://localhost:3001/api"

# 1. Test de santé
Test-Endpoint -Name "Health Check" -Url "$BaseUrl/health"

# 2. Test des statistiques
Test-Endpoint -Name "Dashboard Stats" -Url "$BaseUrl/stats"

# 3. Test de recherche
Test-Endpoint -Name "Search (basic)" -Url "$BaseUrl/search?query=*``&limit=5"

# 4. Test de la liste des fichiers
Test-Endpoint -Name "Files List" -Url "$BaseUrl/upload/files"

# 5. Test de création de transaction
Test-Endpoint -Name "Create Transaction" -Url "$BaseUrl/analytics/transactions" -Method "POST" -Body @{
    transactionId = "TEST-" + (Get-Random -Maximum 99999)
    userId = "user123"
    amount = 150.50
    currency = "USD"
    status = "completed"
    paymentMethod = "credit_card"
    items = @(
        @{
            productId = "PROD-001"
            name = "Test Product"
            quantity = 2
            price = 75.25
        }
    )
}

# 6. Test de récupération des transactions
Test-Endpoint -Name "Get Transactions" -Url "$BaseUrl/analytics/transactions?limit=5"

# 7. Test des statistiques détaillées
Test-Endpoint -Name "Detailed Stats" -Url "$BaseUrl/stats/detailed"

# 8. Test de l'historique de recherche
Test-Endpoint -Name "Search History" -Url "$BaseUrl/search/history"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Tests terminés!" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Certains endpoints peuvent retourner des erreurs si Elasticsearch n'a pas encore d'indices créés." -ForegroundColor Yellow
Write-Host "Cest normal. Une fois des donnees importees, tous les endpoints fonctionneront correctement." -ForegroundColor Yellow
