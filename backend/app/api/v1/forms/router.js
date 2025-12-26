const express = require('express');
const router = express.Router();

// Import semua fungsi yang diekspor dari controller
const {
    getAllForms,
    create,
    getFormDetail,
    update,
    destroy,
    submitForm
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

// PUBLIC: GET form detail for students (MUST be above admin routes to match first)
// Path will be /api/v1/cms/forms/:idForm (cms prefix added in app.js)
router.get('/forms/:idForm/view', authenticatedUser, getFormDetail);

// POST submit form: /api/v1/cms/forms/:idForm/submit
// Accessible by siswa (authenticatedUser saja, tanpa role restriction)
router.post('/forms/:idForm/submit', authenticatedUser, submitForm);

module.exports = router;