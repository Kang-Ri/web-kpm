const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    create,
    index,
    find,
    update,
    destroy,
    exportExcel,
    bulkEnroll,
    availableStudents,
    bulkImportSiswa,
    downloadSiswaTemplate,
} = require('./controller');
const {
    authenticatedUser,
    authorizeRoles,
} = require('../../../middlewares/auth');

// DOWNLOAD TEMPLATE for bulk import siswa
router.get(
    '/siswa-kelas/import-template',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    downloadSiswaTemplate
);

// BULK IMPORT SISWA from Excel
router.post(
    '/siswa-kelas/bulk-import-siswa',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    upload.single('file'),
    bulkImportSiswa
);

// GET AVAILABLE STUDENTS for enrollment
router.get(
    '/siswa-kelas/available',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    availableStudents
);

// BULK ENROLL
router.post(
    '/siswa-kelas/bulk-enroll',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    bulkEnroll
);

// EXPORT Siswa Kelas to Excel
router.get(
    '/siswa-kelas/export',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    exportExcel
);

// GET ALL Siswa Kelas (alias for enrollments)
router.get(
    '/siswa-kelas',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin', 'Guru'),
    index
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

// UPDATE Enrollment Status (alias)
router.patch(
    '/siswa-kelas/:idSiswaKelas',
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

// DELETE Enrollment (alias)
router.delete(
    '/siswa-kelas/:idSiswaKelas',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    destroy
);

module.exports = router;
