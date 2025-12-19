# Backend E-Commerce Analytics

Backend Node.js avec Express pour plateforme d'analytics e-commerce.

## Structure

```
backend/
├── src/
│   ├── config/           # Configuration MongoDB, Elasticsearch, Redis
│   ├── controllers/      # Contrôleurs (logique des routes)
│   ├── services/         # Services métier
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Définition des routes
│   ├── middlewares/     # Middlewares Express
│   ├── utils/           # Utilitaires (logger, etc.)
│   └── index.js         # Point d'entrée
├── .env                 # Variables d'environnement
├── .env.example         # Exemple de configuration
└── package.json         # Dépendances
```

## Installation

```bash
cd backend
npm install
```

## Configuration

Copier `.env.example` vers `.env` et configurer les variables.

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## API Endpoints

### Analytics
- `GET /api/health` - Health check
- `GET /api/analytics/stats` - Statistiques générales
- `GET /api/analytics/search?q=query` - Recherche transactions
- `GET /api/analytics/user/:userId` - Comportement utilisateur
- `GET /api/analytics/transactions` - Liste transactions (pagination)
- `POST /api/analytics/transactions` - Créer une transaction

## Technologies

- Express.js
- MongoDB (Mongoose)
- Elasticsearch
- Redis (ioredis)
- dotenv
