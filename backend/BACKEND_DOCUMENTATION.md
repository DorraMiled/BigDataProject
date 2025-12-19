# Backend - Documentation

## 📋 Vue d'ensemble

Backend Node.js avec Express pour une plateforme d'analytics e-commerce Big Data. L'application fournit des API REST pour la gestion des logs, l'analyse de données via Elasticsearch, et le stockage de métadonnées dans MongoDB avec cache Redis.

## 🏗️ Architecture

### Structure des dossiers

```
backend/
├── src/
│   ├── config/              # Configuration des services
│   │   ├── mongodb.js       # Connexion MongoDB avec Mongoose
│   │   ├── elasticsearch.js # Client Elasticsearch
│   │   └── redis.js         # Client Redis avec retry strategy
│   │
│   ├── models/              # Schémas Mongoose
│   │   ├── Transaction.js   # Modèle des transactions
│   │   ├── FileUpload.js    # Métadonnées des fichiers uploadés
│   │   └── SearchHistory.js # Historique des recherches
│   │
│   ├── services/            # Logique métier
│   │   ├── analyticsService.js      # Analytics avec cache Redis
│   │   ├── uploadService.js         # Gestion des uploads
│   │   └── elasticsearchService.js  # Requêtes Elasticsearch
│   │
│   ├── controllers/         # Gestionnaires de routes
│   │   ├── analyticsController.js
│   │   ├── uploadController.js
│   │   ├── searchController.js
│   │   └── statsController.js
│   │
│   ├── routes/              # Définition des routes
│   │   ├── index.js
│   │   ├── analyticsRoutes.js
│   │   ├── uploadRoutes.js
│   │   ├── searchRoutes.js
│   │   └── statsRoutes.js
│   │
│   ├── middlewares/         # Middlewares Express
│   │   ├── errorHandler.js    # Gestion centralisée des erreurs
│   │   ├── requestLogger.js   # Logger de requêtes HTTP
│   │   └── upload.js          # Configuration Multer
│   │
│   ├── utils/               # Utilitaires
│   │   └── logger.js          # Logger personnalisé
│   │
│   └── index.js             # Point d'entrée du serveur
│
├── .env                     # Variables d'environnement
├── .env.example             # Exemple de configuration
├── package.json             # Dépendances npm
└── README.md                # Ce fichier
```

## 🚀 Démarrage

### Prérequis

- Node.js 18+
- Docker Desktop (pour MongoDB, Redis, Elasticsearch)
- npm ou yarn

### Installation

```bash
cd backend
npm install
```

### Configuration

Copier `.env.example` vers `.env` et configurer les variables :

```env
PORT=3001
NODE_ENV=development

MONGODB_URI=mongodb://admin:admin123@localhost:27017/ecommerce?authSource=admin
ELASTICSEARCH_NODE=http://localhost:9200
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur **http://localhost:3001**

## 📡 API Endpoints

### Santé de l'API

#### GET /api/health
Vérifier l'état du serveur.

**Réponse :**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-12-13T21:00:00.000Z"
}
```

---

### Analytics

#### GET /api/analytics/stats
Statistiques générales des transactions (avec cache Redis 5min).

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalAmount": 458920.50,
    "avgAmount": 152.30,
    "count": 3012
  }
}
```

#### GET /api/analytics/search?q=query
Recherche de transactions dans Elasticsearch.

**Paramètres :**
- `q` (string) : Terme de recherche
- `page` (number) : Page (défaut: 1)
- `limit` (number) : Éléments par page (défaut: 10)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total": 156,
    "transactions": [...]
  }
}
```

#### GET /api/analytics/user/:userId
Analyse du comportement d'un utilisateur (avec cache Redis 10min).

#### GET /api/analytics/transactions
Liste paginée des transactions depuis MongoDB.

#### POST /api/analytics/transactions
Créer une nouvelle transaction.

**Body :**
```json
{
  "transactionId": "TRX-12345",
  "userId": "user123",
  "productId": "prod456",
  "amount": 99.99,
  "status": "completed"
}
```

---

### Upload de fichiers

#### POST /api/upload
Upload un fichier CSV/NDJSON/JSON vers le dossier surveillé par Logstash.

**Form-data :**
- `file` : Fichier (max 100MB)

**Extensions autorisées :** `.csv`, `.json`, `.ndjson`

**Réponse :**
```json
{
  "success": true,
  "message": "Fichier uploadé avec succès",
  "data": {
    "id": "675c...",
    "filename": "transactions_1702492800000.csv",
    "size": 1048576,
    "fileType": "csv",
    "logType": "transaction",
    "status": "pending",
    "uploadDate": "2025-12-13T21:00:00.000Z"
  }
}
```

**Détection automatique du logType :**
- Nom contient "transaction" → `transaction`
- Nom contient "error" → `error`
- Nom contient "fraud" → `fraud`
- Nom contient "performance" → `performance`
- Nom contient "behavior" → `behavior`

#### GET /api/upload/files
Liste paginée des fichiers uploadés.

**Paramètres :**
- `page` (number) : Page
- `limit` (number) : Taille (max 100)
- `status` (string) : Filtre par statut (pending/processed/error)
- `logType` (string) : Filtre par type
- `sortBy` (string) : Champ de tri (défaut: uploadDate)
- `sortOrder` (string) : Ordre (asc/desc)

**Réponse :**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### GET /api/upload/history
Historique des uploads (limite 50).

#### GET /api/upload/:id
Détails d'un upload spécifique.

---

### Recherche dans les logs

#### GET /api/search
Recherche avancée dans Elasticsearch avec sauvegarde de l'historique.

**Paramètres :**
- `query` (string) : Texte à rechercher (défaut: *)
- `dateFrom` (ISO date) : Date de début
- `dateTo` (ISO date) : Date de fin
- `level` (string) : Niveau de log
- `service` (string) : Service
- `logType` (string) : Type de log
- `status` (string) : Statut
- `page` (number) : Page (défaut: 1)
- `size` (number) : Taille (max 100, défaut: 20)
- `sortBy` (string) : Champ de tri (défaut: timestamp)
- `sortOrder` (string) : Ordre (asc/desc)

**Exemple :**
```
GET /api/search?query=error&dateFrom=2025-12-01&status=failed&page=1&size=20
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "total": 156,
    "pagination": {
      "page": 1,
      "size": 20,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "executionTime": "145ms",
    "filters": {
      "query": "error",
      "dateFrom": "2025-12-01",
      "status": "failed"
    }
  }
}
```

#### GET /api/search/history
Historique des recherches effectuées.

**Paramètres :**
- `limit` (number) : Nombre de résultats (défaut: 50)
- `page` (number) : Page

#### GET /api/search/popular
Top 10 des recherches les plus populaires.

#### GET /api/search/stats
Statistiques globales Elasticsearch.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 3156,
    "byIndex": [...],
    "byStatus": [...],
    "transactions": {
      "total": 458920.50,
      "average": 152.30,
      "max": 9999.99,
      "min": 0.01
    },
    "errorsCount": 234,
    "fraudCount": 12,
    "dateRange": {...}
  }
}
```

#### GET /api/search/timeline
Logs groupés par intervalle de temps.

**Paramètres :**
- `dateFrom` (ISO date)
- `dateTo` (ISO date)
- `interval` (string) : 1h, 1d, 1w (défaut: 1h)

#### GET /api/search/log/:id
Détails d'un log spécifique par ID.

**Paramètres optionnels :**
- `index` (string) : Nom de l'index

---

### Statistiques

#### GET /api/stats
**Statistiques dashboard avec cache Redis (60s)** - Formaté pour Chart.js.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLogs": 3156,
      "logsToday": 245,
      "errorsToday": 12,
      "errorRate": "4.90"
    },
    "charts": {
      "hourly": {
        "labels": ["2025-12-13 00:00", "2025-12-13 01:00", ...],
        "datasets": [{
          "label": "Logs par heure",
          "data": [45, 67, 89, ...],
          "backgroundColor": "rgba(54, 162, 235, 0.5)",
          "borderColor": "rgba(54, 162, 235, 1)",
          "borderWidth": 2,
          "fill": true
        }]
      },
      "typeDistribution": {
        "labels": ["Transactions", "Erreurs", "Détection Fraude", ...],
        "datasets": [{
          "label": "Répartition par type",
          "data": [1200, 345, 89, ...],
          "backgroundColor": ["rgba(255, 99, 132, 0.7)", ...],
          "borderWidth": 2
        }]
      }
    }
  },
  "cached": false
}
```

**Utilisation avec Chart.js :**
```javascript
// Line Chart - Logs par heure
new Chart(ctx, {
  type: 'line',
  data: response.data.charts.hourly
});

// Doughnut Chart - Distribution
new Chart(ctx, {
  type: 'doughnut',
  data: response.data.charts.typeDistribution
});
```

#### GET /api/stats/detailed
Statistiques détaillées avec cache Redis (60s).

**Paramètres :**
- `dateFrom` (ISO date) : Défaut: il y a 7 jours
- `dateTo` (ISO date) : Défaut: maintenant

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total": 2456,
    "byStatus": [...],
    "byIndex": [...],
    "transactions": {
      "total": 458920.50,
      "average": 152.30,
      "count": 3012
    },
    "topUsers": [...],
    "dailyTrend": {
      "labels": ["2025-12-07", "2025-12-08", ...],
      "data": [234, 456, 567, ...]
    }
  },
  "cached": true
}
```

---

## 🗄️ Modèles de données

### Transaction
```javascript
{
  transactionId: String (unique, required),
  userId: String (required),
  productId: String,
  amount: Number,
  status: 'pending' | 'completed' | 'failed',
  timestamp: Date
}
```

### FileUpload
```javascript
{
  filename: String (required),
  fileType: 'csv' | 'json' | 'ndjson',
  size: Number (≥0),
  uploadDate: Date,
  status: 'pending' | 'processed' | 'error',
  logType: 'transaction' | 'error' | 'fraud' | 'performance' | 'behavior',
  documentCount: Number (≥0),
  errorMessage: String
}
```

**Méthodes :**
- `markAsProcessed(docCount)` : Marquer comme traité
- `markAsError(errorMsg)` : Marquer comme erreur

### SearchHistory
```javascript
{
  query: String (required),
  filters: {
    dateFrom: Date,
    dateTo: Date,
    level: String,
    service: String,
    logType: String,
    status: String
  },
  pagination: {
    page: Number,
    size: Number
  },
  resultsCount: Number,
  executionTime: Number,
  userId: String,
  ipAddress: String,
  searchDate: Date
}
```

**Méthodes statiques :**
- `getPopularSearches(limit)` : Top recherches

---

## 🔧 Services

### analyticsService.js
- Requêtes Elasticsearch sur les transactions
- Cache Redis (5-10 min)
- Statistiques et recherche

### uploadService.js
- Validation fichiers (extension, taille max 100MB)
- Sauvegarde dans `ecommerce_logs/` (dossier Logstash)
- Détection automatique du type de log
- Enregistrement métadonnées MongoDB

### elasticsearchService.js
- Client Elasticsearch centralisé
- Query DSL pour recherches complexes
- Aggregations pour statistiques
- Gestion erreurs et timeouts (30s)
- 5 indices : transactions, errors, fraud, performance, user_behavior

**Méthodes principales :**
- `searchLogs(filters)` : Recherche multi-critères
- `getStats()` : Stats globales
- `getLogsByHour(options)` : Timeline
- `getLogById(id, index)` : Détails d'un log
- `getTopUsers(options)` : Top utilisateurs actifs
- `healthCheck()` : Santé du cluster

---

## 🛡️ Middlewares

### errorHandler.js
Gestion centralisée des erreurs avec :
- Codes HTTP appropriés
- Messages d'erreur formatés
- Stack trace en développement
- Logs des erreurs

### requestLogger.js
Log de toutes les requêtes HTTP :
```
[INFO] [2025-12-13T21:00:00.000Z] GET /api/stats - IP: ::1
```

### upload.js (Multer)
Configuration upload :
- Stockage en mémoire
- Extensions : `.csv`, `.json`, `.ndjson`
- Taille max : 100MB
- Filtrage automatique

---

## 📦 Technologies utilisées

### Core
- **Node.js 18+** - Runtime JavaScript
- **Express 4.18** - Framework web
- **Mongoose 8.0** - ODM MongoDB

### Bases de données
- **MongoDB 7.0** - Base NoSQL (métadonnées)
- **Elasticsearch 8.11** - Moteur de recherche (logs)
- **Redis 7** - Cache in-memory

### Outils
- **Multer** - Upload de fichiers
- **ioredis** - Client Redis
- **@elastic/elasticsearch** - Client Elasticsearch officiel
- **dotenv** - Gestion variables d'environnement
- **cors** - CORS middleware
- **nodemon** - Auto-reload en dev

---

## 🔄 Système de cache

### Redis Cache Strategy

**Dashboard Stats** (`/api/stats`) :
- Clé : `stats:dashboard`
- TTL : 60 secondes
- Invalidation : Automatique après expiration

**Detailed Stats** (`/api/stats/detailed`) :
- Clé : `stats:detailed:{timestamp_debut}:{timestamp_fin}`
- TTL : 60 secondes
- Clés uniques par plage de dates

**Analytics** :
- Transaction stats : TTL 300s (5 min)
- User behavior : TTL 600s (10 min)

**Avantages :**
- Réduction du temps de réponse : ~150ms → ~2ms
- Diminution de la charge Elasticsearch
- Indicateur `cached: true/false` dans les réponses

---

## 📊 Indices Elasticsearch

L'application interroge 5 indices :

1. **ecommerce_transactions** - Transactions e-commerce
2. **ecommerce_errors** - Logs d'erreurs
3. **ecommerce_fraud_detection** - Détection de fraudes
4. **ecommerce_performance** - Métriques de performance
5. **ecommerce_user_behavior** - Comportement utilisateurs

---

## 🚨 Gestion des erreurs

### Logger personnalisé

4 niveaux de log :
- `info()` : Informations générales
- `error()` : Erreurs
- `warn()` : Avertissements
- `debug()` : Debug (uniquement en développement)

Format :
```
[LEVEL] [ISO_TIMESTAMP] Message
```

### Error Handler

Toutes les erreurs passent par le middleware `errorHandler` :
- Log automatique
- Réponse JSON standardisée
- Stack trace en mode développement
- Codes HTTP appropriés

---

## 🔐 Sécurité

- **CORS activé** : Permet les requêtes cross-origin
- **Validation des données** : Mongoose schemas
- **Taille limite** : 100MB pour uploads
- **Extensions filtrées** : Seulement CSV/JSON/NDJSON
- **Authentification MongoDB** : Credentials requis
- **Timeouts Elasticsearch** : 30s max

---

## 📝 Bonnes pratiques implémentées

✅ Architecture MVC claire et séparée  
✅ Services réutilisables  
✅ Gestion d'erreurs centralisée  
✅ Logging détaillé  
✅ Cache Redis pour performance  
✅ Validation des données (Mongoose)  
✅ Code asynchrone (async/await)  
✅ Variables d'environnement (.env)  
✅ Pagination pour toutes les listes  
✅ Réponses JSON standardisées  
✅ Timeouts pour requêtes externes  
✅ Retry strategy pour Redis  

---

## 🐛 Debugging

### Vérifier les connexions

```bash
# MongoDB
docker exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.adminCommand('ping')"

# Redis
docker exec ecommerce-redis redis-cli ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

### Logs du serveur

Les logs s'affichent dans la console avec timestamps et niveaux.

### Vérifier le cache Redis

```bash
docker exec ecommerce-redis redis-cli
> KEYS stats:*
> GET stats:dashboard
> TTL stats:dashboard
```

---

## 📈 Performances

- **Cache Redis** : Réduction de 98% du temps de réponse sur stats
- **Aggregations** : Elasticsearch optimisé pour analytics
- **Pagination** : Max 100 éléments par page
- **Connexions** : Pool de connexions MongoDB
- **Async** : Requêtes parallèles quand possible

---

## 🔮 Améliorations futures possibles

- [ ] Authentification JWT
- [ ] Rate limiting
- [ ] Webhooks pour notifications
- [ ] Export CSV/PDF des stats
- [ ] Streaming pour gros fichiers
- [ ] Compression des réponses (gzip)
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Tests unitaires et intégration
- [ ] Documentation OpenAPI/Swagger
- [ ] CI/CD pipeline

---

## 👨‍💻 Développement

### Ajouter un nouvel endpoint

1. Créer le controller dans `src/controllers/`
2. Créer les routes dans `src/routes/`
3. Enregistrer dans `src/routes/index.js`
4. Tester avec Postman/curl

### Ajouter un nouveau modèle

1. Créer le schéma dans `src/models/`
2. Ajouter validations et méthodes
3. Utiliser dans les services/controllers

---

## 📞 Support

En cas de problème :
1. Vérifier les logs du serveur
2. Vérifier que Docker containers tournent
3. Vérifier les variables d'environnement
4. Consulter cette documentation

---

**Version :** 1.0.0  
**Dernière mise à jour :** 13 décembre 2025  
**Port par défaut :** 3001
