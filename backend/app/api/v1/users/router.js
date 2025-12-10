const express = require('express');
const router = express.Router();

// 1. Controller untuk Self-Management User (Profile, Change Password)
const selfController = require('./controller'); 
// 2. Controller untuk Admin CRUD Users (Controller yang baru saja Anda konfirmasi)
const adminController = require('./adminController');

// Middleware Otentikasi dan Otorisasi
const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// ==========================================================
// RUTE 1: SELF-MANAGEMENT (Akses oleh SEMUA Role)
// Prefix: /api/v1/cms/users
// ==========================================================

// GET User Profile (/api/v1/cms/users/me)
// Hanya perlu otentikasi (authenticatedUser)
router.get('/me', authenticatedUser, selfController.profile);

// PUT Update Password (/api/v1/cms/users/update-password)
// Hanya perlu otentikasi
router.put('/update-password', authenticatedUser, selfController.changePassword);

// ==========================================================
// RUTE 2: ADMIN MANAGEMENT (Akses oleh Super Admin & Admin)
// Prefix: /api/v1/cms/users
// ==========================================================

// Middleware otorisasi diterapkan di sini:
// Hanya Super Admin dan Admin yang boleh melakukan CRUD di endpoint ini
const adminAuth = [authenticatedUser, authorizeRoles('Super Admin', 'Admin')];

// GET All Users
router.get('/', adminAuth, adminController.index);

// POST Create User (Admin membuat user lain)
router.post('/', adminAuth, adminController.create);

// GET One User
router.get('/:id', adminAuth, adminController.find);

// PUT Update User
router.patch('/:id', adminAuth, adminController.update);

// DELETE User
router.delete('/:id', adminAuth, adminController.destroy);


module.exports = router;