const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true
  },
  filters: {
    dateFrom: Date,
    dateTo: Date,
    level: String,
    service: String,
    logType: String,
    status: String
  },
  pagination: {
    page: {
      type: Number,
      default: 1
    },
    size: {
      type: Number,
      default: 20
    }
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number,
    default: 0
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  ipAddress: String,
  searchDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
searchHistorySchema.index({ searchDate: -1 });
searchHistorySchema.index({ query: 'text' });
searchHistorySchema.index({ userId: 1 });

// Méthode statique pour obtenir les recherches populaires
searchHistorySchema.statics.getPopularSearches = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 },
        lastSearch: { $max: '$searchDate' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
