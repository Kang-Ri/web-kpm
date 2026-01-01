const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    instantUpload,
    linkToEntity,
    getMediaByEntity,
    getPrimaryMedia,
    deleteMedia,
    setAsPrimary,
    updateMedia,
} = require('./controller');

const {
    authenticatedUser,
    authorizeRoles,
} = require('../../../middlewares/auth');

// =====================================================
// Multer Configuration for File Upload
// =====================================================

// Ensure upload directory exists
const uploadBasePath = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(uploadBasePath)) {
    fs.mkdirSync(uploadBasePath, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { entityType } = req.body;

        // Create directory structure: uploads/{entityType}/{year}/{month}/
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const uploadPath = path.join(uploadBasePath, entityType || 'temp', String(year), month);

        // Create directory if not exists
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const { entityType } = req.body;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);

        // Filename: {entityType}_{timestamp}_{random}_{original}.{ext}
        const fileName = `${entityType}_${uniqueSuffix}_${baseName}${ext}`;

        cb(null, fileName);
    }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
    }
};

// Multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// =====================================================
// Routes
// =====================================================

// Instant upload (no entityId required)
router.post('/instant-upload',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    upload.single('file'),
    instantUpload
);

// Link media to entity
router.patch('/:idMedia/link',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    linkToEntity
);

// Get media by entity
router.get('/:entityType/:entityId',
    authenticatedUser,
    getMediaByEntity
);

// Get primary media
router.get('/:entityType/:entityId/primary',
    authenticatedUser,
    getPrimaryMedia
);

// Update media metadata
router.patch('/:idMedia',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    updateMedia
);

// Set as primary
router.patch('/:idMedia/set-primary',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    setAsPrimary
);

// Delete media
router.delete('/:idMedia',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    deleteMedia
);

module.exports = router;
