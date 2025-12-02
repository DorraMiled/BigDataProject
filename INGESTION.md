# Script pour ingérer les logs dans Elasticsearch via Logstash

## 🚀 Démarrage rapide

# 1. Redémarrer Logstash pour prendre en compte la nouvelle configuration
docker-compose restart logstash

# 2. Vérifier les logs de Logstash
docker-compose logs -f logstash

# 3. Attendre quelques secondes que Logstash traite les fichiers

# 4. Vérifier les index créés dans Elasticsearch
Invoke-WebRequest -Uri "http://localhost:9200/_cat/indices?v" -UseBasicParsing

# 5. Compter les documents par index
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions-*/_count" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-errors-*/_count" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-fraud-*/_count" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-performance-*/_count" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-user-behavior-*/_count" -UseBasicParsing

# 6. Voir un exemple de document
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-transactions-*/_search?size=1&pretty" -UseBasicParsing

## 🔍 Vérifications

# Vérifier que les fichiers sont montés dans le conteneur
docker exec -it logstash ls -la /usr/share/logstash/data

# Vérifier la configuration Logstash
docker exec -it logstash cat /usr/share/logstash/pipeline/logstash-files.conf

## 🔄 Réingérer les données

# Si vous voulez réingérer les données, supprimer les index et redémarrer
Invoke-WebRequest -Uri "http://localhost:9200/ecommerce-*" -Method Delete -UseBasicParsing
docker-compose restart logstash

## 📊 Accéder à Kibana

# 1. Ouvrir Kibana: http://localhost:5601
# 2. Aller dans Management > Stack Management > Index Patterns
# 3. Créer les patterns:
#    - ecommerce-transactions-*
#    - ecommerce-errors-*
#    - ecommerce-fraud-*
#    - ecommerce-performance-*
#    - ecommerce-user-behavior-*
# 4. Sélectionner @timestamp comme champ temporel
# 5. Aller dans Discover pour visualiser les données
