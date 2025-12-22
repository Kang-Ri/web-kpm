const express = require('express');
const router = express.Router();
const {
    create,
    index,
    find,
    update,
    destroy,
    exportExcel,
} = require('./controller');
const {
    authenticatedUser,
    authorizeRoles,
} = require('../../../middlewares/auth');

// EXPORT Siswa Kelas to Excel
router.get(
    '/siswa-kelas/export',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    exportExcel
);

// ENROLL Siswa ke Kelas
router.post(
    '/enrollments',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    create
);

// GET ALL Enrollments
router.get(
    '/enrollments',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin', 'Guru'),
    index
);

// GET ONE Enrollment
router.get(
    '/enrollments/:idSiswaKelas',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin', 'Guru'),
    find
);

// UPDATE Enrollment Status
router.patch(
    '/enrollments/:idSiswaKelas',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    update
);

// DELETE Enrollment
router.delete(
    '/enrollments/:idSiswaKelas',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    destroy
);

module.exports = router;
