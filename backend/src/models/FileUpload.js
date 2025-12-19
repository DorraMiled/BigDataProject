const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Le nom du fichier est requis'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'Le type de fichier est requis'],
    enum: {
      values: ['csv', 'json', 'ndjson', 'txt'],
      message: '{VALUE} n\'est pas un type de fichier valide'
    }
  },
  size: {
    type: Number,
    required: [true, 'La taille du fichier est requise'],
    min: [0, 'La taille ne peut pas être négative']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processed', 'error'],
      message: '{VALUE} n\'est pas un statut valide'
    },
    default: 'pending'
  },
  logType: {
    type: String,
    required: [true, 'Le type de log est requis'],
    enum: {
      values: ['transaction', 'error', 'fraud', 'performance', 'behavior'],
      message: '{VALUE} n\'est pas un type de log valide'
    }
  },
  documentCount: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre de documents ne peut pas être négatif']
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
fileUploadSchema.index({ uploadDate: -1 });
fileUploadSchema.index({ status: 1 });
fileUploadSchema.index({ logType: 1 });

// Méthode pour marquer comme traité
fileUploadSchema.methods.markAsProcessed = function(docCount) {
  this.status = 'processed';
  this.documentCount = docCount;
  return this.save();
};

// Méthode pour marquer comme erreur
fileUploadSchema.methods.markAsError = function(errorMsg) {
  this.status = 'error';
  this.errorMessage = errorMsg;
  return this.save();
};

module.exports = mongoose.model('FileUpload', fileUploadSchema);
