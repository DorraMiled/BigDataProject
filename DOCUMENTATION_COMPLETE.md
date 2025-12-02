# Documentation Complète - Projet E-Commerce Big Data avec ELK Stack

## 📋 Table des Matières
1. [Vue d'ensemble du projet](#vue-densemble)
2. [Architecture technique](#architecture)
3. [Configuration initiale](#configuration-initiale)
4. [Configuration ELK Stack](#configuration-elk)
5. [Ingestion des données](#ingestion-donnees)
6. [Problèmes rencontrés et solutions](#problemes-solutions)
7. [Visualisation dans Kibana](#visualisation-kibana)
8. [Commandes utiles](#commandes-utiles)

---

## 🎯 Vue d'ensemble du projet {#vue-densemble}

### Objectif
Créer une plateforme d'analyse Big Data pour un site e-commerce utilisant la stack ELK (Elasticsearch, Logstash, Kibana) pour ingérer, stocker et visualiser les logs d'application.

### Technologies utilisées
- **Docker Desktop** : Conteneurisation des services
- **Elasticsearch 8.11.0** : Moteur de recherche et base de données NoSQL
- **Logstash 8.11.0** : Pipeline d'ingestion et transformation des données
- **Kibana 8.11.0** : Interface de visualisation et analyse
- **MongoDB 7.0** : Base de données principale
- **Redis 7-alpine** : Cache et gestion de sessions
- **Node.js 18** : Backend API
- **PowerShell** : Scripts d'automatisation

### Données traitées
Le projet traite 5 types de logs d'e-commerce :
- **Transactions** : Commandes, paiements (600 documents)
- **Errors** : Erreurs applicatives et API (597 documents)
- **Fraud** : Détection de fraude et bots (600 documents)
- **Performance** : Temps de réponse API (600 documents)
- **User Behavior** : Comportement utilisateur (600 documents)

**Total : ~3000 documents ingérés**

---

## 🏗️ Architecture technique {#architecture}

### Schéma de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │ Elasticsearch│◄─────┤   Logstash   │                   │
│  │  Port 9200   │      │  Port 5000   │                   │
│  └──────┬───────┘      └──────▲───────┘                   │
│         │                     │                            │
│         │              ┌──────┴────────┐                   │
│         │              │  Fichiers Logs │                  │
│         │              │ - transactions │                  │
│         │              │ - errors      │                  │
│  ┌──────▼───────┐      │ - fraud       │                  │
│  │    Kibana    │      │ - performance │                  │
│  │  Port 5601   │      │ - user_behavior│                 │
│  └──────────────┘      └───────────────┘                  │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   MongoDB    │      │    Redis     │                   │
│  │  Port 27017  │      │  Port 6379   │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
│  ┌──────────────┐                                          │
│  │   Backend    │                                          │
│  │  Node.js API │                                          │
│  │  Port 3000   │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘

Flux de données :
Fichiers (CSV/JSON) → Logstash → Elasticsearch → Kibana
```

### Réseau Docker
Tous les services communiquent via le réseau `ecommerce-network` (bridge driver).

### Volumes persistants
- `elasticsearch-data` : Données Elasticsearch
- `mongodb-data` : Données MongoDB
- `redis-data` : Données Redis
- `../ecommerce_logs` : Logs montés en lecture seule

---

## 🚀 Configuration initiale {#configuration-initiale}

### Étape 1 : Création du docker-compose.yml

**Fichier** : `docker-compose.yml`

**Contenu principal** :
- Services : elasticsearch, logstash, kibana, mongodb, redis, backend
- Réseau : ecommerce-network
- Volumes : données persistantes

**Configuration Elasticsearch** :
```yaml
environment:
  - discovery.type=single-node
  - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
  - xpack.security.enabled=false
ports:
  - "9200:9200"
  - "9300:9300"
```

**Raison** : Mode single-node pour développement, sécurité désactivée pour simplifier.

**Configuration Logstash** :
```yaml
volumes:
  - ./elk-config/logstash/logstash-files.conf:/usr/share/logstash/pipeline/logstash.conf
  - ./elk-config/logstash/logstash.yml:/usr/share/logstash/config/logstash.yml
  - ../ecommerce_logs:/usr/share/logstash/data
```

**Raison** : Monte le dossier de logs externe et la configuration personnalisée.

### Étape 2 : Configuration des fichiers ELK

#### A. elasticsearch.yml
**Emplacement** : `elk-config/elasticsearch/elasticsearch.yml`

```yaml
cluster.name: "ecommerce-cluster"
network.host: 0.0.0.0
xpack.security.enabled: false
discovery.type: single-node
```

**Explication** :
- `cluster.name` : Nom du cluster pour identification
- `network.host: 0.0.0.0` : Écoute sur toutes les interfaces
- `xpack.security.enabled: false` : Désactive la sécurité (dev uniquement)
- `discovery.type: single-node` : Mode nœud unique

#### B. logstash.yml
**Emplacement** : `elk-config/logstash/logstash.yml`

```yaml
http.host: "0.0.0.0"
xpack.monitoring.enabled: false
path.config: /usr/share/logstash/pipeline
```

**Explication** :
- Configure le port HTTP et le chemin des pipelines

#### C. kibana.yml
**Emplacement** : `elk-config/kibana/kibana.yml`

```yaml
server.host: "0.0.0.0"
elasticsearch.hosts: ["http://elasticsearch:9200"]
xpack.security.enabled: false
```

**Explication** :
- Connecte Kibana à Elasticsearch via le nom de service Docker

### Étape 3 : Fichier .env

**Emplacement** : `.env`

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/ecommerce?authSource=admin

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_HOST=http://elasticsearch:9200

# Logstash
LOGSTASH_HOST=logstash
LOGSTASH_TCP_PORT=5000
LOGSTASH_HTTP_PORT=8080
```

**Raison** : Centralise toutes les variables d'environnement pour faciliter la configuration.

---

## 🔧 Configuration ELK Stack {#configuration-elk}

### Étape 4 : Configuration du pipeline Logstash

**Fichier** : `elk-config/logstash/logstash-files.conf`

#### Structure du pipeline Logstash

Le pipeline Logstash est divisé en 3 sections :

##### 1. INPUT - Lecture des fichiers

**Fichiers NDJSON (Newline Delimited JSON)** :
```ruby
file {
  path => "/usr/share/logstash/data/transactions.ndjson"
  start_position => "beginning"
  sincedb_path => "/dev/null"
  codec => "json"
  type => "transaction"
}
```

**Explication** :
- `path` : Chemin du fichier dans le conteneur Docker
- `start_position => "beginning"` : Lit depuis le début du fichier
- `sincedb_path => "/dev/null"` : Désactive le suivi de position (relit toujours depuis le début)
- `codec => "json"` : Parser JSON pour NDJSON
- `type => "transaction"` : Tag pour identifier le type de log

**Fichiers CSV** :
```ruby
file {
  path => "/usr/share/logstash/data/transactions.csv"
  start_position => "beginning"
  sincedb_path => "/dev/null"
  type => "transaction"
}
```

**Différence** : Pas de codec, le parsing se fait dans la section filter.

##### 2. FILTER - Transformation des données

**Détection et parsing CSV** :
```ruby
if [log][file][path] =~ /\.csv$/ {
  if [type] == "transaction" {
    csv {
      source => "message"
      separator => ","
      columns => ["timestamp", "event", "order_id", "user", "amount", "method", "duration_ms"]
    }
    mutate {
      convert => {
        "amount" => "float"
        "duration_ms" => "integer"
      }
      remove_field => ["message"]
    }
  }
}
```

**Explication ligne par ligne** :
1. `if [log][file][path] =~ /\.csv$/` : Détecte les fichiers .csv via regex
2. `source => "message"` : Le contenu brut de la ligne CSV est dans le champ "message"
3. `separator => ","` : Sépare les colonnes par virgule
4. `columns => [...]` : Nomme chaque colonne selon l'ordre dans le CSV
5. `convert` : Convertit les types de données (string → float/integer)
6. `remove_field => ["message"]` : Supprime le champ message brut après parsing

**Parsing du timestamp** :
```ruby
if [timestamp] {
  date {
    match => ["timestamp", "ISO8601", "yyyy-MM-dd'T'HH:mm:ss'Z'"]
    target => "@timestamp"
  }
}
```

**Explication** :
- Convertit le champ `timestamp` (string) en objet date
- Stocke dans `@timestamp` (champ standard Elasticsearch pour le tri temporel)
- Supporte plusieurs formats de date

**Détermination de l'index** :
```ruby
if [type] == "transaction" {
  mutate {
    add_field => { "[@metadata][index]" => "ecommerce-transactions" }
  }
}
```

**Explication** :
- `[@metadata][index]` : Variable temporaire non stockée dans Elasticsearch
- Utilisée dans la section output pour router vers le bon index

##### 3. OUTPUT - Envoi vers Elasticsearch

```ruby
output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index]}"
    document_type => "_doc"
  }
  stdout {
    codec => rubydebug
  }
}
```

**Explication** :
- `hosts` : URL d'Elasticsearch (nom de service Docker)
- `index => "%{[@metadata][index]}"` : Utilise l'index déterminé dans filter
- `stdout` : Affiche dans les logs Docker pour debugging

---

## 📊 Ingestion des données {#ingestion-donnees}

### Étape 5 : Préparation des fichiers

#### Structure des fichiers source

**Emplacement** : `C:\Users\DELL\Desktop\3eme\Big Data\ecommerce_logs`

**Fichiers présents** :
```
transactions.csv / transactions.json
errors.csv / errors.json
fraud.csv / fraud.json
performance.csv / performance.json
user_behavior.csv / user_behavior.json
```

#### Structure des fichiers CSV

**transactions.csv** :
```csv
timestamp,event,order_id,user,amount,method,duration_ms
2025-12-01T10:00:27Z,PAYMENT_FAILED,CMD90578,USR842,282.0,card,197
2025-12-01T10:00:46Z,PAYMENT_SUCCESS,CMD93968,USR320,76.77,paypal,139
```

**Colonnes** :
- `timestamp` : Date/heure au format ISO8601
- `event` : Type d'événement (PAYMENT_SUCCESS, ORDER_CREATED, etc.)
- `order_id` : Identifiant de commande (format CMD#####)
- `user` : Identifiant utilisateur (format USR###)
- `amount` : Montant en euros (float)
- `method` : Méthode de paiement (card, paypal, applepay)
- `duration_ms` : Durée en millisecondes (integer)

**errors.csv** :
```csv
timestamp,status,endpoint,message
2025-12-01T11:54:16Z,429,/api/products,Unauthorized
2025-12-01T11:54:49Z,500,/api/orders,Timeout
```

**fraud.csv** :
```csv
timestamp,event,user,ip,attempts
2025-12-01T17:32:05Z,BOT_DETECTED,USR695,192.168.151.200,9
```

**performance.csv** :
```csv
timestamp,event,endpoint,latency_ms,status
2025-12-01T15:43:33Z,API_RESPONSE,/api/products,170,503
```

**user_behavior.csv** :
```csv
timestamp,event,user,page
2025-12-01T13:51:03Z,USER_VISIT,USR574,/category/phones
```

#### Structure des fichiers JSON

**Format original** : JSON Array
```json
[
  {
    "timestamp": "2025-12-01T10:00:27Z",
    "event": "PAYMENT_FAILED",
    "order_id": "CMD90578",
    "user": "USR842",
    "amount": 282.0,
    "method": "card",
    "duration_ms": 197
  },
  {
    ...
  }
]
```

**Problème** : Logstash ne peut pas parser directement un JSON array multi-ligne.

**Solution** : Conversion en NDJSON (Newline Delimited JSON).

### Étape 6 : Script de conversion NDJSON

**Fichier** : `scripts/convert-to-ndjson.ps1`

```powershell
$sourcePath = "C:\Users\DELL\Desktop\3eme\Big Data\ecommerce_logs"
$files = @("transactions", "errors", "fraud", "performance", "user_behavior")

foreach ($file in $files) {
    $jsonFile = Join-Path $sourcePath "$file.json"
    $ndjsonFile = Join-Path $sourcePath "$file.ndjson"
    
    if (Test-Path $jsonFile) {
        # Lire le JSON array
        $jsonContent = Get-Content $jsonFile -Raw | ConvertFrom-Json
        
        # Ecrire chaque objet sur une ligne
        $lines = $jsonContent | ForEach-Object {
            ($_ | ConvertTo-Json -Compress)
        }
        [System.IO.File]::WriteAllLines($ndjsonFile, $lines)
    }
}
```

**Explication étape par étape** :

1. **Définition du chemin source** :
   ```powershell
   $sourcePath = "C:\Users\DELL\Desktop\3eme\Big Data\ecommerce_logs"
   ```

2. **Liste des fichiers à traiter** :
   ```powershell
   $files = @("transactions", "errors", "fraud", "performance", "user_behavior")
   ```

3. **Boucle de traitement** :
   - `Get-Content -Raw` : Lit tout le fichier en une seule string
   - `ConvertFrom-Json` : Parse le JSON array en objets PowerShell
   - `ConvertTo-Json -Compress` : Convertit chaque objet en JSON sur une ligne
   - `[System.IO.File]::WriteAllLines()` : Écrit sans BOM ni retours chariages Windows

**Résultat NDJSON** :
```json
{"timestamp":"2025-12-01T10:00:27Z","event":"PAYMENT_FAILED","order_id":"CMD90578","user":"USR842","amount":282.0,"method":"card","duration_ms":197}
{"timestamp":"2025-12-01T10:00:46Z","event":"PAYMENT_SUCCESS","order_id":"CMD93968","user":"USR320","amount":76.77,"method":"paypal","duration_ms":139}
```

**Avantage NDJSON** : Chaque ligne est un JSON valide, facile à streamer et parser ligne par ligne.

**Exécution du script** :
```powershell
& "C:\Users\DELL\Desktop\3eme\Big Data\ECommerceBigData\scripts\convert-to-ndjson.ps1"
```

**Résultat** :
```
Conversion des fichiers JSON en NDJSON...
  Traitement: transactions.json
  OK: transactions.ndjson cree (300 objets)
  Traitement: errors.json
  OK: errors.ndjson cree (300 objets)
  ...
```

### Étape 7 : Démarrage des services

```powershell
# Naviguer dans le dossier du projet
cd "C:\Users\DELL\Desktop\3eme\Big Data\ECommerceBigData"

# Démarrer tous les services
docker-compose up -d

# Vérifier les conteneurs
docker-compose ps
```

**Sortie attendue** :
```
NAME            IMAGE                                         STATUS
elasticsearch   docker.elastic.co/elasticsearch:8.11.0        Up (healthy)
kibana          docker.elastic.co/kibana:8.11.0               Up
logstash        docker.elastic.co/logstash:8.11.0             Up
mongodb         mongo:7.0                                     Up
redis           redis:7-alpine                                Up
backend         ecommercebigdata-backend                      Up
```

### Étape 8 : Vérification de l'ingestion

**Attendre 30 secondes** que Logstash traite les fichiers :
```powershell
Start-Sleep -Seconds 30
```

**Vérifier les index créés** :
```powershell
Invoke-WebRequest -Uri "http://localhost:9200/_cat/indices?v" -UseBasicParsing
```

**Résultat attendu** :
```
health status index                   uuid                   pri rep docs.count
yellow open   ecommerce-transactions  YUhv4ra3RmSYGd4K_jwSBw   1   1        600
yellow open   ecommerce-errors        txB__AcSQ3mxwBoudNJF5g   1   1        597
yellow open   ecommerce-fraud         1hNLSEXrTlS7nQE7wBQUMQ   1   1        600
yellow open   ecommerce-performance   _aKbxFPBQ1mn7TAmXMRQPQ   1   1        600
yellow open   ecommerce-user-behavior lDcR0ek7SqO48qHBW0nCeA   1   1        600
```

**Explication du statut "yellow"** : Normal pour un cluster single-node (pas de réplication).

**Vérifier le contenu d'un document** :
```powershell
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_search?size=1&pretty" -UseBasicParsing
```

**Document exemple** :
```json
{
  "_index": "ecommerce-transactions",
  "_id": "MldB3poBy4W42xw6Uymw",
  "_score": 1.0,
  "_source": {
    "event": "ORDER_CREATED",
    "user": "USR742",
    "type": "transaction",
    "amount": 260.69,
    "method": "paypal",
    "@timestamp": "2025-12-01T10:14:24.000Z",
    "duration_ms": 357,
    "order_id": "CMD93060"
  }
}
```

---

## 🐛 Problèmes rencontrés et solutions {#problemes-solutions}

### Problème 1 : Docker Desktop not running

**Erreur** :
```
unable to get image: error during connect: open //./pipe/dockerDesktopLinuxEngine
```

**Cause** : Docker Desktop n'était pas démarré.

**Solution** :
1. Ouvrir Docker Desktop depuis le menu Démarrer
2. Attendre que l'icône Docker dans la barre des tâches soit stable
3. Vérifier avec `docker --version`
4. Relancer `docker-compose up -d`

### Problème 2 : Version obsolète dans docker-compose.yml

**Avertissement** :
```
the attribute `version` is obsolete, it will be ignored
```

**Solution** : Suppression de la ligne `version: '3.8'` du fichier docker-compose.yml.

**Explication** : Les versions récentes de Docker Compose n'ont plus besoin de cette ligne.

### Problème 3 : Parsing JSON multi-ligne échoue

**Erreur dans les logs Logstash** :
```
"tags" => ["_jsonparsefailure"]
"message" => "  {"
```

**Cause** : Les fichiers JSON sont des arrays multi-lignes, pas du NDJSON.

**Solution** : Création du script `convert-to-ndjson.ps1` pour convertir.

**Avant** :
```json
[
  {
    "field": "value"
  }
]
```

**Après (NDJSON)** :
```json
{"field":"value"}
```

### Problème 4 : Fichiers CSV non parsés

**Symptôme** : Les documents dans Elasticsearch contiennent seulement un champ `message` avec toute la ligne CSV.

**Exemple de document incorrect** :
```json
{
  "message": "2025-12-01T10:09:51Z,PAYMENT_SUCCESS,CMD92637,USR354,64.2,applepay,571\r",
  "type": "transaction"
}
```

**Cause** : Le filtre CSV ne détectait pas correctement les fichiers CSV.

**Code problématique** :
```ruby
if [path] =~ "\.csv$" {  # ❌ Le champ [path] n'existe pas
  csv { ... }
}
```

**Solution** : Utilisation du bon chemin de champ et ajout de `source => "message"` :
```ruby
if [log][file][path] =~ /\.csv$/ {  # ✅ Bon chemin
  csv {
    source => "message"  # ✅ Parser le champ message
    separator => ","
    columns => [...]
  }
  mutate {
    remove_field => ["message"]  # ✅ Supprimer après parsing
  }
}
```

**Résultat après correction** :
```json
{
  "event": "PAYMENT_SUCCESS",
  "order_id": "CMD92637",
  "user": "USR354",
  "amount": 64.2,
  "method": "applepay",
  "duration_ms": 571,
  "@timestamp": "2025-12-01T10:09:51.000Z"
}
```

### Problème 5 : Double configuration Logstash

**Symptôme** : Deux fichiers de pipeline sont chargés simultanément.

**Vérification** :
```powershell
docker exec -it logstash ls -la /usr/share/logstash/pipeline/
# Résultat: logstash.conf ET logstash-files.conf
```

**Cause** : Le docker-compose.yml montait deux fichiers :
```yaml
volumes:
  - ./elk-config/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  - ./elk-config/logstash/logstash-files.conf:/usr/share/logstash/pipeline/logstash-files.conf
```

**Solution** : Garder seulement un fichier de configuration :
```yaml
volumes:
  - ./elk-config/logstash/logstash-files.conf:/usr/share/logstash/pipeline/logstash.conf
```

### Problème 6 : Encoding Windows (CRLF vs LF)

**Symptôme** : Les fichiers NDJSON contiennent `\r` (retour chariot Windows).

**Cause** : `Out-File` en PowerShell utilise l'encoding Windows par défaut.

**Code problématique** :
```powershell
$lines | Out-File -FilePath $ndjsonFile -Encoding UTF8  # ❌ Ajoute CRLF
```

**Solution** : Utilisation de la méthode .NET :
```powershell
[System.IO.File]::WriteAllLines($ndjsonFile, $lines)  # ✅ Utilise LF uniquement
```

### Problème 7 : Index vides dans Kibana

**Symptôme** : Les index existent mais apparaissent vides dans Kibana Discover.

**Cause** : Le filtre de temps (Time Range) dans Kibana était mal configuré.

**Solution** :
1. Dans Kibana Discover, cliquer sur le calendrier en haut à droite
2. Sélectionner "Last 7 days" ou "Last 30 days"
3. Ou définir une plage personnalisée incluant le 1er décembre 2025

**Explication** : Les logs ont des timestamps du 1er décembre 2025, si Kibana affiche "Last 15 minutes", aucune donnée n'apparaît.

---

## 📊 Visualisation dans Kibana {#visualisation-kibana}

### Étape 9 : Configuration des Index Patterns

**Accès** : http://localhost:5601

#### Création d'un Index Pattern

1. **Navigation** :
   - Cliquer sur le menu hamburger (☰) en haut à gauche
   - Aller dans **Management** → **Stack Management**
   - Dans le menu gauche, section **Kibana**, cliquer sur **Data Views** (ou **Index Patterns**)

2. **Création** :
   - Cliquer sur **Create data view**
   - Name: `Transactions E-Commerce`
   - Index pattern: `ecommerce-transactions`
   - Timestamp field: `@timestamp`
   - Cliquer sur **Save data view to Kibana**

3. **Répéter pour chaque type** :
   - `ecommerce-errors`
   - `ecommerce-fraud`
   - `ecommerce-performance`
   - `ecommerce-user-behavior`

4. **Pattern global (optionnel)** :
   - Index pattern: `ecommerce-*`
   - Permet de chercher dans tous les index simultanément

#### Vérification dans Discover

1. Aller dans **Analytics** → **Discover**
2. Sélectionner un index pattern dans le menu déroulant
3. Ajuster le Time Range (ex: Last 30 days)
4. Explorer les champs dans la colonne gauche

**Champs disponibles par index** :

**Transactions** :
- `event` : Type d'événement
- `order_id` : ID commande
- `user` : ID utilisateur
- `amount` : Montant
- `method` : Méthode paiement
- `duration_ms` : Durée traitement

**Errors** :
- `status` : Code HTTP
- `endpoint` : URL API
- `error_message` : Message d'erreur
- `timestamp` : Date/heure

**Fraud** :
- `event` : Type de fraude
- `user` : Utilisateur suspect
- `ip` : Adresse IP
- `attempts` : Nombre tentatives

**Performance** :
- `event` : Type événement
- `endpoint` : URL
- `latency_ms` : Latence
- `status` : Code retour

**User Behavior** :
- `event` : Action utilisateur
- `user` : ID utilisateur
- `page` : Page visitée

### Exemples de requêtes KQL

**KQL** (Kibana Query Language) permet de filtrer les données.

#### Transactions échouées
```kql
event: "PAYMENT_FAILED"
```

#### Transactions par méthode de paiement
```kql
method: "paypal"
```

#### Montants élevés
```kql
amount > 200
```

#### Erreurs 500
```kql
status: 500
```

#### Fraude détectée
```kql
event: "BOT_DETECTED"
```

#### Performance lente
```kql
latency_ms > 500
```

#### Utilisateur spécifique
```kql
user: "USR123"
```

#### Combinaison
```kql
event: "PAYMENT_SUCCESS" AND method: "card" AND amount > 100
```

### Création de visualisations

#### 1. Graphique en secteurs (Pie Chart) - Répartition des paiements

1. Aller dans **Analytics** → **Visualize Library**
2. Cliquer sur **Create visualization**
3. Sélectionner **Pie**
4. Choisir l'index `ecommerce-transactions`
5. Configuration :
   - **Slice by** : Terms
   - **Field** : method.keyword
   - **Size** : 10
6. Cliquer sur **Update**
7. Sauvegarder la visualisation

#### 2. Graphique linéaire - Transactions au fil du temps

1. **Visualize Library** → **Create visualization** → **Line**
2. Index : `ecommerce-transactions`
3. Configuration :
   - **Vertical axis** : Count
   - **Horizontal axis** : @timestamp (Date Histogram)
   - **Minimum interval** : 1 hour
4. Filtres optionnels : `event: "PAYMENT_SUCCESS"`

#### 3. Tableau de données - Top utilisateurs

1. **Visualize Library** → **Create visualization** → **Data table**
2. Index : `ecommerce-transactions`
3. Configuration :
   - **Rows** : Terms of user.keyword (Top 10)
   - **Metrics** :
     - Count
     - Sum of amount
     - Average of duration_ms

#### 4. Métrique - Montant total

1. **Visualize Library** → **Create visualization** → **Metric**
2. Index : `ecommerce-transactions`
3. Configuration :
   - **Metric** : Sum
   - **Field** : amount
4. Ajouter un filtre : `event: "PAYMENT_SUCCESS"`

#### 5. Graphique à barres - Erreurs par endpoint

1. **Visualize Library** → **Create visualization** → **Bar vertical**
2. Index : `ecommerce-errors`
3. Configuration :
   - **Y-axis** : Count
   - **X-axis** : Terms of endpoint.keyword
   - **Split series** : Terms of status

### Création d'un Dashboard

1. Aller dans **Analytics** → **Dashboard**
2. Cliquer sur **Create dashboard**
3. Cliquer sur **Add** pour ajouter des visualisations
4. Sélectionner les visualisations créées précédemment
5. Organiser avec drag & drop
6. Ajuster les tailles
7. Sauvegarder le dashboard

**Exemple de structure de dashboard** :
```
┌─────────────────────────────────────────────────┐
│        Dashboard E-Commerce - Vue d'ensemble    │
├──────────────┬──────────────┬───────────────────┤
│ Montant Total│ Nb Commandes │ Tx de succès      │
├──────────────┴──────────────┴───────────────────┤
│ Transactions au fil du temps (Line Chart)       │
├──────────────────────┬──────────────────────────┤
│ Répartition paiement │ Top 10 utilisateurs      │
│ (Pie Chart)          │ (Table)                  │
├──────────────────────┴──────────────────────────┤
│ Erreurs par endpoint (Bar Chart)                │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Commandes utiles {#commandes-utiles}

### Gestion Docker Compose

```powershell
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d elasticsearch

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: perte de données)
docker-compose down -v

# Voir les logs de tous les services
docker-compose logs

# Suivre les logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f logstash

# Voir les dernières 50 lignes
docker-compose logs --tail=50 logstash

# Voir le statut des conteneurs
docker-compose ps

# Redémarrer un service
docker-compose restart logstash

# Rebuild et redémarrer
docker-compose up -d --build backend
```

### Commandes Elasticsearch

```powershell
# Vérifier la santé du cluster
Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health?pretty" -UseBasicParsing

# Lister tous les index
Invoke-WebRequest -Uri "http://localhost:9200/_cat/indices?v" -UseBasicParsing

# Voir les index triés
Invoke-WebRequest -Uri "http://localhost:9200/_cat/indices?v&s=index" -UseBasicParsing

# Compter les documents d'un index
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_count" -UseBasicParsing

# Chercher dans un index (1 document)
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_search?size=1&pretty" -UseBasicParsing

# Chercher avec une requête
$body = '{"query":{"match":{"event":"PAYMENT_SUCCESS"}}}'
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_search?pretty" -Method Post -Body $body -ContentType "application/json"

# Supprimer un index
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions" -Method Delete -UseBasicParsing

# Supprimer tous les documents (mais garder l'index)
$body = '{"query":{"match_all":{}}}'
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_delete_by_query" -Method Post -Body $body -ContentType "application/json"

# Voir le mapping d'un index
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_mapping?pretty" -UseBasicParsing

# Voir les statistiques d'un index
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions/_stats?pretty" -UseBasicParsing
```

### Commandes Docker exec

```powershell
# Accéder au shell d'un conteneur
docker exec -it elasticsearch bash
docker exec -it logstash bash
docker exec -it kibana bash

# Voir les fichiers dans Logstash
docker exec -it logstash ls -la /usr/share/logstash/data/

# Voir les pipelines Logstash
docker exec -it logstash ls -la /usr/share/logstash/pipeline/

# Voir la configuration Elasticsearch
docker exec -it elasticsearch cat /usr/share/elasticsearch/config/elasticsearch.yml

# Tester la connectivité
docker exec -it logstash curl http://elasticsearch:9200

# Voir les processus
docker exec -it elasticsearch ps aux
```

### Scripts PowerShell

```powershell
# Conversion NDJSON
& "C:\Users\DELL\Desktop\3eme\Big Data\ECommerceBigData\scripts\convert-to-ndjson.ps1"

# Vérifier tous les index avec détails
$indices = @("transactions", "errors", "fraud", "performance", "user-behavior")
foreach ($idx in $indices) {
    Write-Host "`n=== ecommerce-$idx ===" -ForegroundColor Cyan
    $r = Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-$idx/_search?size=1" -UseBasicParsing
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Documents: $($json.hits.total.value)"
}

# Supprimer tous les index ecommerce
@("transactions", "errors", "fraud", "performance", "user-behavior") | ForEach-Object {
    Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-$_" -Method Delete -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "Supprime: ecommerce-$_"
}
```

### Debugging

```powershell
# Vérifier que Docker Desktop fonctionne
docker --version
docker ps

# Vérifier la connectivité réseau
docker network ls
docker network inspect ecommercebigdata_ecommerce-network

# Vérifier les volumes
docker volume ls
docker volume inspect ecommercebigdata_elasticsearch-data

# Voir l'utilisation des ressources
docker stats

# Voir les logs du démarrage
docker-compose up

# Nettoyer les ressources inutilisées
docker system prune -a --volumes
```

---

## 📈 Résultats finaux

### Statistiques d'ingestion

```
Index                    Documents  Taille
─────────────────────────────────────────────
ecommerce-transactions   600        221.2kb
ecommerce-errors         597        211.2kb
ecommerce-fraud          600        183.2kb
ecommerce-performance    600        143.4kb
ecommerce-user-behavior  600        160.0kb
─────────────────────────────────────────────
TOTAL                    2,997      ~919kb
```

### Performance

- **Temps d'ingestion** : ~30 secondes pour ~3000 documents
- **Temps de recherche** : < 10ms pour les requêtes simples
- **Mémoire Elasticsearch** : 512MB heap
- **Mémoire Logstash** : 256MB heap

### Architecture finale

```
Fichiers sources (CSV + JSON)
    ↓
Script PowerShell (conversion NDJSON)
    ↓
Volume Docker (../ecommerce_logs)
    ↓
Logstash (parsing + transformation)
    ↓
Elasticsearch (stockage + indexation)
    ↓
Kibana (visualisation + analyse)
```

---

## 🎓 Concepts clés appris

### 1. Architecture ELK

- **E**lasticsearch : Base de données NoSQL orientée recherche
- **L**ogstash : ETL (Extract, Transform, Load) pour données
- **K**ibana : Interface de visualisation

### 2. Docker Compose

- Orchestration multi-conteneurs
- Réseaux Docker
- Volumes persistants
- Health checks

### 3. Logstash Pipelines

- Input plugins (file, tcp, http)
- Filter plugins (csv, json, date, mutate)
- Output plugins (elasticsearch, stdout)
- Conditions et patterns regex

### 4. Elasticsearch

- Index et documents
- Mapping automatique
- API REST
- Requêtes et agrégations

### 5. Kibana

- Index Patterns / Data Views
- Discover (exploration)
- Visualize Library (graphiques)
- Dashboard (tableaux de bord)
- KQL (Kibana Query Language)

---

## 🚀 Améliorations possibles

### Court terme

1. **Sécurité** :
   - Activer x-pack security
   - Créer des utilisateurs avec rôles
   - Utiliser HTTPS

2. **Performance** :
   - Augmenter la heap Elasticsearch
   - Ajouter des index lifecycle policies
   - Optimiser les mappings

3. **Monitoring** :
   - Ajouter Metricbeat
   - Configurer les alertes
   - Dashboard de monitoring

### Long terme

1. **Scalabilité** :
   - Cluster Elasticsearch multi-nodes
   - Load balancer pour Kibana
   - Multiple Logstash instances

2. **Backend API** :
   - Routes REST pour ingestion en temps réel
   - WebSocket pour streaming
   - Rate limiting

3. **Frontend Angular** :
   - Dashboard personnalisé
   - Intégration Elasticsearch JS
   - Graphiques temps réel

4. **Machine Learning** :
   - Détection d'anomalies
   - Prédiction de fraude
   - Recommandations produits

---

## 📚 Ressources

### Documentation officielle

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### Fichiers de configuration

```
ECommerceBigData/
├── docker-compose.yml
├── .env
├── .gitignore
├── README.md
├── KIBANA_GUIDE.md
├── INGESTION.md
├── elk-config/
│   ├── elasticsearch/
│   │   └── elasticsearch.yml
│   ├── logstash/
│   │   ├── logstash.yml
│   │   └── logstash-files.conf
│   └── kibana/
│       └── kibana.yml
├── backend/
│   ├── package.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── scripts/
└── scripts/
    └── convert-to-ndjson.ps1
```

---

## ✅ Checklist de démarrage

- [ ] Docker Desktop installé et démarré
- [ ] Fichiers de logs dans `ecommerce_logs/`
- [ ] Script NDJSON exécuté
- [ ] `docker-compose up -d` exécuté
- [ ] Attendre 30-60 secondes
- [ ] Vérifier les index : `http://localhost:9200/_cat/indices?v`
- [ ] Accéder à Kibana : `http://localhost:5601`
- [ ] Créer les Index Patterns
- [ ] Explorer dans Discover
- [ ] Créer des visualisations
- [ ] Assembler un Dashboard

---

## 🆘 Support et dépannage

### Problème : Elasticsearch ne démarre pas

**Vérifications** :
```powershell
docker-compose logs elasticsearch
```

**Solutions** :
- Augmenter la mémoire Docker (Settings > Resources > Memory : 4GB+)
- Vérifier les ports disponibles : `netstat -ano | findstr "9200"`

### Problème : Aucun document dans les index

**Vérifications** :
```powershell
docker-compose logs logstash
docker exec -it logstash ls -la /usr/share/logstash/data/
```

**Solutions** :
- Vérifier que les fichiers NDJSON existent
- Vérifier la configuration Logstash
- Redémarrer Logstash : `docker-compose restart logstash`

### Problème : Kibana n'affiche pas les données

**Solutions** :
- Ajuster le Time Range (Last 30 days)
- Rafraîchir l'Index Pattern (Management > Index Patterns > Refresh)
- Vérifier que @timestamp est configuré

---

**Fin de la documentation**

*Projet réalisé le 2 décembre 2025*
*Stack : Elasticsearch 8.11.0, Logstash 8.11.0, Kibana 8.11.0*
*Plateforme : Docker Desktop sur Windows*
