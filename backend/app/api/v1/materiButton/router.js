const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    create,
    index,
    getActive,
    find,
    update,
    destroy,
    bulkImport,
    downloadBulkTemplate,
    reorder, // NEW
} = require('./controller');

const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// CREATE Button (Admin & Super Admin)
router.post(
    '/materi-buttons',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    create
);

// GET ALL Buttons (Authenticated users)
router.get(
    '/materi-buttons',
    authenticatedUser,
    index
);

// GET ACTIVE Buttons untuk Materi tertentu (untuk siswa)
router.get(
    '/materi/:idProduk/buttons/active',
    getActive
);

// GET ONE Button (Authenticated users)
router.get(
    '/materi-buttons/:idButton',
    authenticatedUser,
    find
);

// UPDATE Button (Admin & Super Admin)
router.patch(
    '/materi-buttons/:idButton',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    update
);

// DELETE Button (Admin & Super Admin)
router.delete(
    '/materi-buttons/:idButton',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    destroy
);

// REORDER Buttons (Admin & Super Admin)
router.patch(
    '/materi/:idProduk/buttons/reorder',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    reorder
);

// BULK IMPORT MateriButton (Admin & Super Admin)
router.post(
    '/materi-buttons/bulk-import',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    upload.single('file'),
    bulkImport
);

// DOWNLOAD TEMPLATE Bulk Import
router.get(
    '/materi-buttons/bulk-template',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    downloadBulkTemplate
);

module.exports = router;
