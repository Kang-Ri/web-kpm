const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    index,
    find,
    create,
    update,
    destroy,
    importMateri,
    downloadTemplate,
    bulkImportMateri,
    downloadBulkTemplate
} = require("./controller");

const {
    authenticatedUser,
    authorizeRoles,
} = require("../../../middlewares/auth");

const productPrefix = "/product";

// GET ALL (Index)
router.get(
    productPrefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru", "PJ"),
    index
);

// GET ONE (Find)
router.get(
    `${productPrefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru", "PJ"),
    find
);

// POST (Create)
router.post(
    productPrefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "PJ"),
    create
);

// PATCH (Update)
router.patch(
    `${productPrefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "PJ"),
    update
);

// DELETE (Destroy)
router.delete(
    `${productPrefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"), // Allow both
    destroy
);

// POST - Import Materi from Excel (single Ruang Kelas)
router.post(
    `${productPrefix}/import`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"),
    upload.single('file'),
    importMateri
);

// GET - Download Template Excel (single)
router.get(
    `${productPrefix}/template`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "PJ"),
    downloadTemplate
);

// POST - Bulk Import Materi (multiple Ruang Kelas)
router.post(
    `${productPrefix}/bulk-import`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"),
    upload.single('file'),
    bulkImportMateri
);

// GET - Download Bulk Template Excel
router.get(
    `${productPrefix}/bulk-template`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "PJ"),
    downloadBulkTemplate
);

module.exports = router;