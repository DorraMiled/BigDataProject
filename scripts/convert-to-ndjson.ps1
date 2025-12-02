# Script pour convertir les fichiers JSON en format NDJSON (une ligne par objet)
# Cela permet à Logstash de les lire correctement

$sourcePath = "C:\Users\DELL\Desktop\3eme\Big Data\ecommerce_logs"
$files = @("transactions", "errors", "fraud", "performance", "user_behavior")

Write-Host "Conversion des fichiers JSON en NDJSON..." -ForegroundColor Cyan

foreach ($file in $files) {
    $jsonFile = Join-Path $sourcePath "$file.json"
    $ndjsonFile = Join-Path $sourcePath "$file.ndjson"
    
    if (Test-Path $jsonFile) {
        Write-Host "  Traitement: $file.json"
        
        # Lire le JSON array
        $jsonContent = Get-Content $jsonFile -Raw | ConvertFrom-Json
        
        # Ecrire chaque objet sur une ligne
        $lines = $jsonContent | ForEach-Object {
            ($_ | ConvertTo-Json -Compress)
        }
        [System.IO.File]::WriteAllLines($ndjsonFile, $lines)
        
        $count = $jsonContent.Count
        Write-Host "  OK: $file.ndjson cree ($count objets)" -ForegroundColor Green
    } else {
        Write-Host "  Attention: $file.json non trouve" -ForegroundColor Yellow
    }
}

Write-Host "`nConversion terminee!" -ForegroundColor Green
Write-Host "`nFichiers NDJSON crees dans: $sourcePath" -ForegroundColor Cyan
