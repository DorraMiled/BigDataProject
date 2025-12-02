# API Backend E-Commerce

API Node.js pour ingérer les logs dans Elasticsearch via Logstash.

## 🚀 Démarrage

### 1. Construire et démarrer le backend

```powershell
cd "c:\Users\DELL\Desktop\3eme\Big Data\ECommerceBigData"
docker-compose up -d --build backend
```

### 2. Vérifier que le backend fonctionne

```powershell
# Vérifier les logs
docker-compose logs -f backend

# Health check
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
```

## 📡 Endpoints API

### 1. Health Check
```http
GET http://localhost:3000/health
```

### 2. Ingérer TOUS les fichiers de logs
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest" -Method Post -UseBasicParsing
```

### 3. Ingérer un type spécifique de logs
```powershell
# Transactions
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest/transactions" -Method Post -UseBasicParsing

# Errors
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest/errors" -Method Post -UseBasicParsing

# Fraud
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest/fraud" -Method Post -UseBasicParsing

# Performance
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest/performance" -Method Post -UseBasicParsing

# User Behavior
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest/user_behavior" -Method Post -UseBasicParsing
```

### 4. Envoyer un log personnalisé
```powershell
$body = @{
    type = "order"
    orderId = "12345"
    userId = "user123"
    amount = 99.99
    status = "completed"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/logs/send" -Method Post -Body $body -ContentType "application/json"
```

### 5. Envoyer plusieurs logs en batch
```powershell
$body = @{
    logs = @(
        @{ type = "order"; orderId = "001"; amount = 50.00 },
        @{ type = "order"; orderId = "002"; amount = 75.50 },
        @{ type = "order"; orderId = "003"; amount = 120.00 }
    )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri "http://localhost:3000/api/logs/batch" -Method Post -Body $body -ContentType "application/json"
```

## 🔧 Script d'ingestion manuel

Si vous préférez lancer l'ingestion depuis le conteneur :

```powershell
# Accéder au conteneur
docker exec -it backend sh

# Lancer le script d'ingestion
npm run ingest
```

## 📊 Vérifier les données dans Elasticsearch

```powershell
# Voir tous les index
Invoke-WebRequest -Uri "http://localhost:9200/_cat/indices?v" -UseBasicParsing

# Compter les documents
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-*/_count" -UseBasicParsing

# Voir des exemples de documents
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transaction/_search?size=2&pretty" -UseBasicParsing
```

## 🎯 Workflow complet

```powershell
# 1. Démarrer tous les services
docker-compose up -d

# 2. Attendre que tout soit prêt (environ 30 secondes)
Start-Sleep -Seconds 30

# 3. Ingérer tous les logs via l'API
Invoke-WebRequest -Uri "http://localhost:3000/api/logs/ingest" -Method Post -UseBasicParsing

# 4. Vérifier dans Elasticsearch
Invoke-WebRequest -Uri "http://localhost:9200/_cat/indices?v" -UseBasicParsing

# 5. Visualiser dans Kibana
# Ouvrir: http://localhost:5601
```

## 🔍 Debugging

```powershell
# Voir les logs du backend
docker-compose logs -f backend

# Voir les logs de Logstash
docker-compose logs -f logstash

# Voir les logs d'Elasticsearch
docker-compose logs -f elasticsearch

# Redémarrer le backend
docker-compose restart backend
```

## 📁 Structure des fichiers

Les fichiers de logs sont montés dans `/app/logs` dans le conteneur backend :
- transactions.json / transactions.csv
- errors.json / errors.csv
- fraud.json / fraud.csv
- performance.json / performance.csv
- user_behavior.json / user_behavior.csv

## ⚡ Avantages de cette approche

✅ **API REST** : Contrôle total sur l'ingestion
✅ **Flexible** : Ingérer tous les logs ou par type
✅ **Monitoring** : Voir le statut et les erreurs
✅ **Automatisable** : Peut être appelé par d'autres services
✅ **Batch support** : Envoyer plusieurs logs à la fois
