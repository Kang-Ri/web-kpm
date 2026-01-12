const dotenv = require('dotenv');
dotenv.config();

/**
 * Fungsi ini memformat objek User dari database untuk dijadikan payload 
 * (muatan data) dalam JSON Web Token (JWT).
 * * @param {Object} user - Objek pengguna hasil query dari database (tabel Users).
 * @returns {Object} - Payload JWT yang aman dan ringkas.
 */
const createTokenUser = (user) => {
  console.log("didalam cretaeTokenUser", user);
  return {
    idUser: user.idUser,
    email: user.email,
    idRole: user.idRole, // Keep for reference
    role: user.Role?.namaRole || user.namaRole, // CRITICAL: Role NAME for authorization checks
    namaLengkap: user.namaLengkap,
    idSiswa: user.idSiswa, // NEW: Include idSiswa if present (for Siswa role)
  };
};

// Pastikan Anda mengimpor dotenv di sini atau di file konfigurasi utama

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  // Tentukan waktu kedaluwarsa cookie (harus sesuai dengan expiry Refresh Token, misal 30 hari)
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // Tidak bisa diakses oleh JavaScript client side (keamanan XSS)
    secure: process.env.NODE_ENV === 'production', // Hanya kirim via HTTPS di production
    signed: true, // Menggunakan cookie signature untuk mencegah tampering
    expires: new Date(Date.now() + thirtyDays),
  });
};

module.exports = {
  createTokenUser,
  attachCookiesToResponse
};