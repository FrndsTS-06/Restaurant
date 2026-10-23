const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.memoryStorage();

// Allowed MIME types for standard images
const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];

// Storage directories for local persistence & Vite client synchronization
const SERVER_UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
const SERVER_MODELS_DIR = path.join(SERVER_UPLOADS_DIR, 'models');
const SERVER_POSTERS_DIR = path.join(SERVER_UPLOADS_DIR, 'posters');
const CLIENT_FOOD_MODELS_DIR = path.join(__dirname, '../../../client/public/models/food');
const CLIENT_POSTERS_DIR = path.join(CLIENT_FOOD_MODELS_DIR, 'posters');

[SERVER_UPLOADS_DIR, SERVER_MODELS_DIR, SERVER_POSTERS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// -------------------------------------------------------------
// 1. STANDARD IMAGE UPLOAD (Original Functionality Preserved)
// -------------------------------------------------------------
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file format. Only JPEG, PNG, WEBP, and AVIF images are permitted.');
      err.statusCode = 400;
      cb(err, false);
    }
  }
});

const handleMulterImageUpload = (req, res, next) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size exceeds 5MB limit. Please upload a smaller image.', 400);
      }
      return sendError(res, err.message || 'File upload validation failed', 400);
    }
    next();
  });
};

router.post('/', protect, authorize('admin'), handleMulterImageUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please provide an image file to upload', 400);
    }

    const result = await uploadToCloudinary(req.file.buffer);

    return sendSuccess(res, {
      url: result.secure_url,
      publicId: result.public_id
    }, 'Dish image uploaded successfully to Cloudinary', 201);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 2. 3D MODEL UPLOAD (.glb / .gltf)
// -------------------------------------------------------------
const allowedModelMimeTypes = [
  'model/gltf-binary',
  'model/gltf+json',
  'application/octet-stream',
  'application/json'
];

const uploadModel = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit for high-poly 3D food assets
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.glb' && ext !== '.gltf') {
      const err = new Error('Invalid 3D model format. Only .glb and .gltf files are permitted.');
      err.statusCode = 400;
      return cb(err, false);
    }
    if (file.mimetype && !allowedModelMimeTypes.includes(file.mimetype)) {
      const err = new Error('Invalid file MIME type for 3D model.');
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

const handleMulterModelUpload = (req, res, next) => {
  uploadModel.single('model3d')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, '3D model file size exceeds 30MB limit. Please optimize meshes and textures.', 400);
      }
      return sendError(res, err.message || '3D Model upload validation failed', 400);
    }
    next();
  });
};

router.post('/model3d', protect, authorize('admin'), handleMulterModelUpload, async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return sendError(res, 'Please provide a 3D model file (.glb or .gltf) to upload', 400);
    }

    const buffer = req.file.buffer;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Deep Magic Byte & Structural Integrity Verification
    if (ext === '.glb') {
      if (buffer.length < 12) {
        return sendError(res, 'Invalid 3D model file: buffer is truncated.', 400);
      }
      // Binary GLB header magic must be 0x46546C67 (ASCII "glTF" in little-endian)
      const magic = buffer.slice(0, 4).toString('ascii');
      if (magic !== 'glTF') {
        return sendError(res, 'Invalid 3D model format. Binary GLB files must contain the valid glTF header signature.', 400);
      }
      const version = buffer.readUInt32LE(4);
      if (version !== 2 && version !== 1) {
        return sendError(res, `Unsupported glTF version (${version}). Only version 2 is supported.`, 400);
      }
    } else if (ext === '.gltf') {
      try {
        const parsed = JSON.parse(buffer.toString('utf8'));
        if (!parsed || typeof parsed !== 'object' || !parsed.asset) {
          return sendError(res, 'Invalid GLTF structure. Missing required asset property in glTF JSON.', 400);
        }
      } catch (jsonErr) {
        return sendError(res, 'Malformed GLTF file: unable to parse glTF JSON descriptor.', 400);
      }
    }

    // Generate safe, sanitized unique filename
    const safeBaseName = req.file.originalname
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const filename = `dish-model-${uniqueSuffix}${ext}`;

    // Write to server uploads directory
    const serverFilePath = path.join(SERVER_MODELS_DIR, filename);
    fs.writeFileSync(serverFilePath, buffer);

    // Synchronize to client public models folder for instant Vite dev server access
    if (fs.existsSync(CLIENT_FOOD_MODELS_DIR)) {
      try {
        const clientFilePath = path.join(CLIENT_FOOD_MODELS_DIR, filename);
        fs.writeFileSync(clientFilePath, buffer);
      } catch (syncErr) {
        console.warn('Could not mirror 3D model to client public folder:', syncErr.message);
      }
    }

    return sendSuccess(res, {
      url: `/models/food/${filename}`,
      serverUrl: `/uploads/models/${filename}`,
      filename,
      sizeBytes: buffer.length,
      originalName: req.file.originalname
    }, '3D food model validated and uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 3. 3D POSTER PREVIEW IMAGE UPLOAD
// -------------------------------------------------------------
const uploadPoster = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid poster image format. Permitted types: JPEG, PNG, WEBP, AVIF.');
      err.statusCode = 400;
      cb(err, false);
    }
  }
});

const handleMulterPosterUpload = (req, res, next) => {
  uploadPoster.single('poster')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Poster image exceeds 10MB limit.', 400);
      }
      return sendError(res, err.message || 'Poster upload validation failed', 400);
    }
    next();
  });
};

router.post('/poster', protect, authorize('admin'), handleMulterPosterUpload, async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return sendError(res, 'Please provide an image file for the 3D model poster preview', 400);
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = `poster-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const serverPosterPath = path.join(SERVER_POSTERS_DIR, filename);
    fs.writeFileSync(serverPosterPath, req.file.buffer);

    if (fs.existsSync(CLIENT_POSTERS_DIR)) {
      try {
        fs.writeFileSync(path.join(CLIENT_POSTERS_DIR, filename), req.file.buffer);
      } catch (e) {
        console.warn('Could not mirror poster to client folder:', e.message);
      }
    }

    // Also attempt Cloudinary upload if available
    let cdnUrl = `/uploads/posters/${filename}`;
    try {
      const cdnResult = await uploadToCloudinary(req.file.buffer, 'restaurantpro/models/posters');
      if (cdnResult?.secure_url && !cdnResult.secure_url.includes('unsplash')) {
        cdnUrl = cdnResult.secure_url;
      }
    } catch (e) {
      // Use local server URL if Cloudinary fails
    }

    return sendSuccess(res, {
      url: cdnUrl,
      localUrl: `/uploads/posters/${filename}`,
      filename
    }, '3D model poster image uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 4. SAFELY REMOVE 3D MODEL ASSET
// -------------------------------------------------------------
router.delete('/model3d/:filename', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Sanitize filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return sendError(res, 'Invalid model filename provided.', 400);
    }

    const serverFile = path.join(SERVER_MODELS_DIR, filename);
    const clientFile = path.join(CLIENT_FOOD_MODELS_DIR, filename);

    let removed = false;
    if (fs.existsSync(serverFile)) {
      fs.unlinkSync(serverFile);
      removed = true;
    }
    if (fs.existsSync(clientFile)) {
      try {
        fs.unlinkSync(clientFile);
        removed = true;
      } catch (e) {
        // Ignored
      }
    }

    return sendSuccess(res, { filename, removed }, '3D model file removed safely from storage');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
