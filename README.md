# Projet E-Commerce Big Data

Projet e-commerce avec Angular, Node.js, MongoDB, Redis et ELK Stack pour l'analyse de données.

## 🏗️ Architecture

- **Frontend**: Angular
- **Backend**: Node.js
- **Base de données**: MongoDB
- **Cache**: Redis
- **Logs & Analytics**: ELK Stack (Elasticsearch, Logstash, Kibana)

## 📋 Prérequis

- Docker Desktop installé et en cours d'exécution
- Docker Compose
- Au moins 4GB de RAM disponible pour Docker

## 🚀 Installation et Démarrage

### 1. Cloner le projet et naviguer dans le répertoire

```powershell
cd "c:\Users\DELL\Desktop\3eme\Big Data\ECommerceBigData"
```

### 2. Démarrer ELK Stack avec Docker Compose

```powershell
docker-compose up -d
```

Cette commande va démarrer tous les services :
- Elasticsearch (port 9200)
- Logstash (ports 5000 et 8080)
- Kibana (port 5601)
- MongoDB (port 27017)
- Redis (port 6379)

### 3. Vérifier que tous les conteneurs sont en cours d'exécution

```powershell
docker-compose ps
```

### 4. Vérifier les logs en cas de problème

```powershell
# Tous les services
docker-compose logs

# Service spécifique
docker-compose logs elasticsearch
docker-compose logs logstash
docker-compose logs kibana
```

## 🔗 Accès aux Services

- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601
- **Logstash TCP**: localhost:5000
- **Logstash HTTP**: http://localhost:8080
- **MongoDB**: mongodb://admin:admin123@localhost:27017
- **Redis**: localhost:6379

## 📊 Configuration ELK

### Elasticsearch
- Cluster: `ecommerce-cluster`
- Mode: Single-node (pour développement)
- Sécurité désactivée (développement uniquement)

### Logstash
Pipelines configurés pour :
- Logs des commandes (`ecommerce-orders-*`)
- Logs des utilisateurs (`ecommerce-users-*`)
- Logs des produits (`ecommerce-products-*`)
- Logs applicatifs (`ecommerce-app-logs-*`)

### Kibana
Interface de visualisation accessible sur http://localhost:5601

## 🧪 Tester la Configuration

### 1. Vérifier Elasticsearch

```powershell
Invoke-WebRequest -Uri http://localhost:9200 -UseBasicParsing
```

### 2. Envoyer un log de test à Logstash

```powershell
$body = @{
    type = "order"
    orderId = "12345"
    userId = "user123"
    amount = 99.99
    status = "completed"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8080 -Method Post -Body $body -ContentType "application/json"
```

### 3. Vérifier les index dans Elasticsearch

```powershell
Invoke-WebRequest -Uri http://localhost:9200/_cat/indices?v -UseBasicParsing
```

### 4. Créer un Index Pattern dans Kibana

1. Accéder à Kibana: http://localhost:5601
2. Aller dans **Management** > **Stack Management** > **Index Patterns**
3. Créer un pattern : `ecommerce-*`
4. Sélectionner `@timestamp` comme champ temporel

## 🛠️ Commandes Utiles

### Arrêter tous les services
```powershell
docker-compose down
```

### Arrêter et supprimer les volumes (attention : supprime les données)
```powershell
docker-compose down -v
```

### Redémarrer un service spécifique
```powershell
docker-compose restart elasticsearch
```

### Voir les logs en temps réel
```powershell
docker-compose logs -f elasticsearch
```

### Accéder au shell d'un conteneur
```powershell
docker exec -it elasticsearch bash
docker exec -it mongodb bash
```

## 📁 Structure du Projet

```
ECommerceBigData/
├── docker-compose.yml          # Configuration Docker Compose
├── .env                        # Variables d'environnement
├── elk-config/                 # Configurations ELK
│   ├── elasticsearch/
│   │   └── elasticsearch.yml
│   ├── logstash/
│   │   ├── logstash.conf
│   │   └── logstash.yml
│   └── kibana/
│       └── kibana.yml
├── backend/                    # À créer : API Node.js
├── frontend/                   # À créer : Application Angular
└── README.md
```

## 🔐 Sécurité

⚠️ **Attention**: Cette configuration est pour le développement uniquement !

Pour la production :
- Activer la sécurité Elasticsearch (xpack.security.enabled: true)
- Changer les mots de passe par défaut
- Utiliser des certificats SSL/TLS
- Configurer un firewall

## 📚 Prochaines Étapes

1. ✅ Configuration ELK Stack
2. ⏳ Développement du backend Node.js
3. ⏳ Développement du frontend Angular
4. ⏳ Intégration des logs avec Logstash
5. ⏳ Création de dashboards Kibana
6. ⏳ Analyse des données e-commerce

## 🐛 Dépannage

### Elasticsearch ne démarre pas
- Vérifier que Docker Desktop a suffisamment de mémoire (min 4GB)
- Vérifier les logs : `docker-compose logs elasticsearch`

### Port déjà utilisé
- Vérifier les ports : `netstat -ano | findstr "9200"`
- Arrêter le processus ou changer le port dans docker-compose.yml

### Problème de connexion entre services
- Vérifier que tous les conteneurs sont sur le même réseau
- Utiliser les noms de services (elasticsearch, mongodb) au lieu de localhost

## 📞 Support

Pour toute question, consulter la documentation officielle :
- [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Docker Compose](https://docs.docker.com/compose/)
