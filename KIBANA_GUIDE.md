# Guide pour visualiser les données dans Kibana

## Etape 1: Ouvrir Kibana
http://localhost:5601

## Etape 2: Creer les Index Patterns

1. Cliquez sur le menu (☰) en haut a gauche
2. Allez dans **Management** > **Stack Management**
3. Dans la section **Kibana**, cliquez sur **Index Patterns** (ou **Data Views**)
4. Cliquez sur **Create index pattern** (ou **Create data view**)

### Patterns a creer:

#### 1. Transactions
- Index pattern: `ecommerce-transactions`
- Time field: `@timestamp`

#### 2. Errors  
- Index pattern: `ecommerce-errors`
- Time field: `@timestamp`

#### 3. Fraud
- Index pattern: `ecommerce-fraud`
- Time field: `@timestamp`

#### 4. Performance
- Index pattern: `ecommerce-performance`
- Time field: `@timestamp`

#### 5. User Behavior
- Index pattern: `ecommerce-user-behavior`
- Time field: `@timestamp`

#### 6. Tous les donnees (optionnel)
- Index pattern: `ecommerce-*`
- Time field: `@timestamp`

## Etape 3: Visualiser les donnees

1. Allez dans **Analytics** > **Discover**
2. Selectionnez un index pattern dans le menu deroulant
3. Ajustez la periode de temps (Time range) en haut a droite
4. Explorez vos donnees!

## Statistiques actuelles:

```
ecommerce-transactions  : 601 documents
ecommerce-errors        : 601 documents  
ecommerce-fraud         : 601 documents
ecommerce-performance   : 601 documents
ecommerce-user-behavior : 601 documents
```

## Exemples de requetes KQL dans Discover:

### Transactions echouees
```
event: "PAYMENT_FAILED"
```

### Errors 500
```
status: 500
```

### Fraude detectee
```
event: "BOT_DETECTED"
```

### Performance lente
```
latency_ms > 500
```

### Utilisateurs specifiques
```
user: "USR123"
```

## Creer des visualisations

1. Allez dans **Analytics** > **Visualize Library**
2. Cliquez sur **Create visualization**
3. Choisissez le type de visualisation
4. Selectionnez votre index pattern
5. Configurez les metriques et buckets

### Exemples de visualisations:

- **Pie chart**: Repartition des types de paiement (method)
- **Line chart**: Transactions par heure
- **Data table**: Top 10 utilisateurs par montant
- **Metric**: Montant total des transactions
- **Bar chart**: Erreurs par endpoint

## Creer un Dashboard

1. Allez dans **Analytics** > **Dashboard**
2. Cliquez sur **Create dashboard**
3. Ajoutez vos visualisations
4. Sauvegardez le dashboard

Profitez de vos donnees dans Kibana! 📊
