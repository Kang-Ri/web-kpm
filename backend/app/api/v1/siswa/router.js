const express = require('express');
const router = express.Router();
const {
    create,
    index,
    find,
    update,
    destroy,
} = require('./controller');

// Middleware (uncomment when ready)
// const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// CREATE Siswa
router.post(
    '/siswa',
    // authenticatedUser,
    // authorizeRoles('Super Admin', 'Admin'),
    create
);

// GET ALL Siswa
router.get(
    '/siswa',
    // authenticatedUser,
    index
);

// GET ONE Siswa
router.get(
    '/siswa/:idSiswa',
    // authenticatedUser,
    find
);

// UPDATE Siswa
router.patch(
    '/siswa/:idSiswa',
    // authenticatedUser,
    // authorizeRoles('Super Admin', 'Admin'),
    update
);

// DELETE Siswa
router.delete(
    '/siswa/:idSiswa',
    // authenticatedUser,
    // authorizeRoles('Super Admin'),
    destroy
);

module.exports = router;
