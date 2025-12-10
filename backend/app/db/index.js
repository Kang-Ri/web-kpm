const sequelize = require('./sequelizeConfig');
const { defineAssociations } = require('./association'); // Import fungsi asosiasi

// ==========================================================
// 1. INISIALISASI SEMUA MODEL
// ==========================================================
// Memastikan SEMUA model di-require agar terdaftar di instance Sequelize
// Walaupun variabelnya tidak digunakan, proses require menjalankan sequelize.define()
// sehingga model siap digunakan untuk asosiasi.
require('../api/v1/parentProduct1/model');
require('../api/v1/parentProduct2/model');
require('../api/v1/product/model');

// Model yang lain juga perlu diinisialisasi
require('../api/v1/users/model');
require('../api/v1/roles/model');
require('../api/v1/userRefreshTokens/model');

// Tambahkan model Refresh Token
// ... require model lainnya jika ada ...

// ==========================================================
// 2. DEFINISI ASOSIASI
// ==========================================================
// Panggil fungsi ini setelah semua model di atas selesai di-require.
defineAssociations();

// ==========================================================
// 3. SINKRONISASI (Contoh)
// ==========================================================
// PENTING: Gunakan alter: true untuk menambahkan FK ke tabel yang sudah ada.
sequelize.sync()
    .then(() => {
        console.log('Database & tabel berhasil disinkronkan. Semua asosiasi telah aktif!');
    })
    .catch(err => {
        console.error('Error saat sinkronisasi database:', err);
    });

module.exports = sequelize; // Ekspor instance sequelize