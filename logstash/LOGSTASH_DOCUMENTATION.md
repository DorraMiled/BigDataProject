# Documentation Logstash - E-Commerce Analytics Platform

## Vue d'ensemble

Configuration Logstash avec **2 pipelines** pour l'ingestion automatique de fichiers CSV et JSON vers Elasticsearch.

## Architecture

```
Fichiers (CSV/JSON) → Logstash Pipelines → Enrichissement → Elasticsearch
                           ↓
                    - Parsing
                    - Filtrage
                    - Transformation
                    - Géolocalisation
                    - Détection fraude
```

---

## Pipelines Configurés

### 1. Pipeline CSV - Transactions E-Commerce

**Fichier:** `logstash/pipelines/csv-transactions.conf`

#### Input
- **Chemin surveillé:** `/usr/share/logstash/data/csv/*.csv`
- **Mode:** Lecture complète avec sincedb
- **Type:** `transaction_csv`

#### Filtres Utilisés

1. **CSV Parser**
   - Colonnes: transactionId, userId, timestamp, amount, currency, status, paymentMethod, productId, etc.
   - Gestion des erreurs avec tag `_csvparsefailure`

2. **Date Parser**
   - Formats supportés: ISO8601, yyyy-MM-dd HH:mm:ss, UNIX
   - Target: `@timestamp`

3. **Mutate**
   - Conversion types: amount (float), quantity (integer), price (float)
   - Normalisation: uppercase currency, lowercase status

4. **Ruby**
   - Calcul montant total: `quantity * price`
   - Détection fraude basique (amount > 10000 = high risk)

5. **GeoIP**
   - Source: `ipAddress`
   - Extraction: country, city, latitude, longitude

6. **User Agent**
   - Parsing: browser, OS, device
   - Source: `userAgent`

7. **Grok**
   - Extraction domaine email si userId est un email
   - Patterns personnalisés depuis `/patterns/ecommerce-patterns`

#### Enrichissements
- ✅ Calcul du montant total
- ✅ Niveau de risque de fraude (low/medium/high)
- ✅ Géolocalisation (pays, ville, coordonnées GPS)
- ✅ Informations navigateur/OS
- ✅ Tags selon le statut (transaction_success, transaction_failed, etc.)
- ✅ Domaine email

#### Output
- **Index principal:** `ecommerce_transactions-YYYY.MM.dd`
- **Index erreurs:** `ecommerce_errors-YYYY.MM.dd`
- **Document ID:** `transactionId` (dédupliquation automatique)

---

### 2. Pipeline JSON - Logs Application

**Fichier:** `logstash/pipelines/json-logs.conf`

#### Input
- **Chemin surveillé:** `/usr/share/logstash/data/json/*.{json,ndjson,jsonl}`
- **Codec:** `json_lines` (NDJSON support)
- **Type:** `log_json`

#### Filtres Utilisés

1. **JSON Parser**
   - Parsing automatique via codec
   - Gestion des erreurs avec tag `_jsonparsefailure`

2. **Date Parser**
   - Formats multiples: ISO8601, UNIX, UNIX_MS, etc.
   - Fallback sur timestamp actuel si absent

3. **Routing Intelligent**
   - Détection automatique du `logType`
   - Routage vers l'index approprié

4. **Mutate**
   - Conversion types selon le logType
   - Normalisation des niveaux de log (uppercase)

5. **GeoIP**
   - Support IP v4/v6
   - Exclusion IPs locales (127.0.0.1, localhost)

6. **User Agent**
   - Extraction browser, version, OS, device

7. **Ruby**
   - Calcul de durée (si startTime et endTime présents)
   - Output: duration_seconds, duration_ms

8. **Pattern Detection**
   - Erreurs SQL: tag `database_error`
   - Erreurs réseau: tag `network_error`
   - Erreurs auth: tag `auth_error`

#### Enrichissements
- ✅ Géolocalisation IP
- ✅ Parsing User Agent
- ✅ Calcul de durée d'exécution
- ✅ Détection automatique de patterns d'erreurs
- ✅ Tags selon la sévérité (high/medium severity)
- ✅ Routing automatique vers index approprié

#### Routing par LogType

| logType | Index Elasticsearch |
|---------|-------------------|
| transaction | ecommerce_transactions |
| error, ERROR, FATAL | ecommerce_errors |
| fraud, fraud_detection | ecommerce_fraud_detection |
| performance, perf | ecommerce_performance |
| user_behavior, user | ecommerce_user_behavior |
| (autres) | ecommerce_general |

#### Output
- **Index dynamique:** `%{[@metadata][index_name]}-YYYY.MM.dd`
- **Index erreurs:** `ecommerce_parse_errors-YYYY.MM.dd`
- **Document ID:** Fingerprint SHA256 si pas d'ID fourni

---

## Configuration Principale

### logstash.yml

```yaml
node.name: logstash-ecommerce
pipeline.workers: 2
pipeline.batch.size: 125
config.reload.automatic: true
queue.type: memory
dead_letter_queue.enable: true
```

### pipelines.yml

```yaml
- pipeline.id: csv-transactions
  path.config: "/usr/share/logstash/pipelines/csv-transactions.conf"
  
- pipeline.id: json-logs
  path.config: "/usr/share/logstash/pipelines/json-logs.conf"
```

---

## Patterns Grok Personnalisés

**Fichier:** `logstash/patterns/ecommerce-patterns`

Patterns définis:
- `TRANSACTION_ID`: Format TXN-XXX-YYYY
- `CURRENCY_CODE`: Codes ISO 3 lettres (USD, EUR, GBP)
- `PAYMENT_METHOD`: credit_card, paypal, crypto, etc.
- `TRANSACTION_STATUS`: completed, pending, failed, etc.
- `ECOMMERCE_LOG`: Pattern de log structuré
- `ERROR_LOG`: Pattern d'erreur
- `API_REQUEST`: Pattern de requête HTTP

---

## Gestion des Erreurs

### Stratégies Implémentées

1. **Parsing Errors**
   - Tag: `_csvparsefailure`, `_jsonparsefailure`
   - Action: Envoi vers index `ecommerce_errors` ou `ecommerce_parse_errors`
   - Préservation: Message original dans `original_message`

2. **Date Parsing Errors**
   - Tag: `_dateparsefailure`
   - Fallback: Utilisation du timestamp actuel

3. **GeoIP Lookup Errors**
   - Tag: `_geoip_lookup_failure`
   - Action: Continue le traitement sans géolocalisation

4. **Dead Letter Queue**
   - Activée pour les documents non traités
   - Limite: 1GB
   - Permet le retraitement manuel

### Monitoring

- **API Logstash:** http://localhost:9600
- **Endpoints:**
  - `/_node/stats` - Statistiques
  - `/_node/pipelines` - État des pipelines
  - `/_node/hot_threads` - Debug performance

---

## Utilisation

### 1. Démarrer Logstash

```bash
docker-compose up -d logstash
```

### 2. Vérifier les Logs

```bash
docker logs -f logstash
```

### 3. Ajouter des Fichiers

**CSV:**
```bash
cp transactions.csv logstash/data/csv/
```

**JSON:**
```bash
cp logs.ndjson logstash/data/json/
```

### 4. Vérifier l'Ingestion

```bash
# Compter les documents dans Elasticsearch
curl http://localhost:9200/ecommerce_transactions-*/_count

# Voir les derniers documents
curl http://localhost:9200/ecommerce_transactions-*/_search?size=5&sort=@timestamp:desc
```

---

## Tests Fournis

### Fichier CSV de Test
- **Emplacement:** `logstash/data/csv/sample_transactions.csv`
- **Contenu:** 10 transactions avec données variées
- **Cas testés:**
  - Transactions réussies/échouées
  - Montants variés (détection fraude)
  - Devises multiples (USD, EUR, GBP)
  - IPs différentes (géolocalisation)
  - User Agents variés

### Fichier JSON de Test
- **Emplacement:** `logstash/data/json/sample_logs.ndjson`
- **Contenu:** 10 logs de différents types
- **Types testés:**
  - Erreurs (ERROR, FATAL)
  - User behavior (page_view, add_to_cart)
  - Performance metrics
  - Fraud detection
  - Transactions

---

## Indices Elasticsearch Créés

Après ingestion, les indices suivants seront créés:

1. `ecommerce_transactions-YYYY.MM.dd` - Transactions e-commerce
2. `ecommerce_errors-YYYY.MM.dd` - Logs d'erreurs
3. `ecommerce_fraud_detection-YYYY.MM.dd` - Détection de fraude
4. `ecommerce_performance-YYYY.MM.dd` - Métriques de performance
5. `ecommerce_user_behavior-YYYY.MM.dd` - Comportement utilisateurs
6. `ecommerce_general-YYYY.MM.dd` - Logs généraux
7. `ecommerce_parse_errors-YYYY.MM.dd` - Erreurs de parsing

---

## Performance

### Optimisations Appliquées

- **Pipeline workers:** 2 (parallélisation)
- **Batch size:** 125 documents
- **Batch delay:** 50ms
- **Memory queue:** 1GB
- **Retry on conflict:** 5 tentatives

### Métriques Attendues

- **Débit CSV:** ~1000 lignes/seconde
- **Débit JSON:** ~2000 documents/seconde
- **Latence moyenne:** < 100ms par document

---

## Dépannage

### Logstash ne démarre pas

```bash
# Vérifier les logs
docker logs logstash

# Vérifier la configuration
docker exec logstash bin/logstash --config.test_and_exit -f /usr/share/logstash/pipelines/
```

### Les fichiers ne sont pas traités

```bash
# Vérifier les permissions
ls -la logstash/data/csv/
ls -la logstash/data/json/

# Vérifier le sincedb (position de lecture)
docker exec logstash cat /usr/share/logstash/data/sincedb_csv
docker exec logstash cat /usr/share/logstash/data/sincedb_json
```

### Erreurs de parsing

```bash
# Voir les documents avec erreurs
curl http://localhost:9200/ecommerce_parse_errors-*/_search?pretty
```

---

## Prochaines Étapes

1. ✅ Pipelines CSV et JSON configurés
2. ✅ Filtres et enrichissements appliqués
3. ✅ Gestion des erreurs implémentée
4. ⏳ Tester avec données réelles
5. ⏳ Créer dashboards Kibana
6. ⏳ Configurer alertes
7. ⏳ Optimiser performance selon volume

---

## Résumé des Filtres Utilisés

### Pipeline CSV
- ✅ csv
- ✅ date
- ✅ mutate
- ✅ grok
- ✅ ruby
- ✅ geoip
- ✅ useragent
- ✅ drop (pour lignes vides)

### Pipeline JSON
- ✅ json (via codec json_lines)
- ✅ date
- ✅ mutate
- ✅ grok (pour patterns)
- ✅ ruby (calculs)
- ✅ geoip
- ✅ useragent
- ✅ fingerprint (génération ID)

**Tous les critères requis sont satisfaits! ✅**
