const express = require('express');
const router = express.Router();

// Import semua fungsi yang diekspor dari controller
const {
    getAllForms,
    create,
    getFormDetail,
    update,
    destroy
} = require('./controller');

const {
    authenticatedUser,
    authorizeRoles,
} = require("../../../middlewares/auth");

// Asumsi Anda memiliki middleware otentikasi/otorisasi
// const { authenticateToken, checkRole } = require('../../middleware/auth'); 

// GET semua form: /api/v1/forms
router.get('/forms', authenticatedUser,
    authorizeRoles("Super Admin", "Admin"), getAllForms);

// POST buat form baru: /api/v1/forms
router.post('/forms', authenticatedUser,
    authorizeRoles("Super Admin", "Admin"), create);

// GET form berdasarkan ID: /api/v1/forms/:idForm
router.get('/forms/:idForm', authenticatedUser,
    authorizeRoles("Super Admin", "Admin"), getFormDetail);

// PUT/PATCH perbarui form: /api/v1/forms/:idForm
// Menggunakan .put() untuk update penuh (seperti CRUD standar)
router.patch('/forms/:idForm', authenticatedUser,
    authorizeRoles("Super Admin", "Admin"), update);

// DELETE hapus form: /api/v1/forms/:idForm
router.delete('/forms/:idForm', authenticatedUser,
    authorizeRoles("Super Admin", "Admin"), destroy);

module.exports = router;