const multer = require('multer');
const path = require('path');

// Configuration multer pour stocker en mémoire
const storage = multer.memoryStorage();

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.ndjson', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Extension non autorisée. Extensions acceptées: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = upload;
