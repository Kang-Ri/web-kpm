const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
    create,
    index,
    find,
    update,
    destroy,
    bulkImport,
    bulkDelete,
    exportData,
    resetPassword,
    // Enrollment controllers
    enrollmentDashboard,
    parent2List,
    finishProfile,
} = require('./controller');

// Middleware (uncomment when ready)
// const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// Multer configuration for Excel file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only Excel files
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File harus berformat Excel (.xls atau .xlsx)'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// BULK IMPORT Siswa (Excel Upload)
router.post(
    '/siswa/bulk-import',
    // authenticatedUser,
    // authorizeRoles('Super Admin', 'Admin'),
    upload.single('file'),
    bulkImport
);

// BULK DELETE Siswa
router.delete(
    '/siswa/bulk-delete',
    // authenticatedUser,
    // authorizeRoles('Super Admin', 'Admin'),
    bulkDelete
);

// EXPORT Siswa Data
router.get(
    '/siswa/export',
    // authenticatedUser,
    exportData
);

// RESET Siswa Password
router.post(
    '/siswa/:idSiswa/reset-password',
    // authenticatedUser,
    // authorizeRoles('Super Admin', 'Admin'),
    resetPassword
);

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

// === ENROLLMENT ROUTES ===

// Get enrollment dashboard data (3 sections filtered by jenjangKelas)
router.get(
    '/siswa/:idSiswa/enrollment-dashboard',
    enrollmentDashboard
);

// Get parent2 list for specific parent1
router.get(
    '/siswa/:idSiswa/parent1/:idParent1/parent2',
    parent2List
);

// Complete siswa profile
router.patch(
    '/siswa/:idSiswa/complete-profile',
    finishProfile
);

module.exports = router;

