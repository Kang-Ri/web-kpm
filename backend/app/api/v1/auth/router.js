const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    userLogout,
    sendOTP,
    updatePasswordWithOTP,
    refresh
} = require('./controller'); 

// --- Rute Otentikasi ---

// Pendaftaran User Baru
router.post('/auth/register', register); 

// Login (Sign In)
router.post('/auth/login', login);

// Logout
router.get('/auth/logout', userLogout); 

// Lupa Password (Memicu pengiriman OTP)
router.post('/auth/forgot-password', sendOTP); 

// Reset Password (Menggunakan OTP dan Password Baru)
router.post('/auth/reset-password', updatePasswordWithOTP); 

// Refresh Token (Mendapatkan Access Token Baru)
router.post('/auth/refresh-token', refresh);


module.exports = router;