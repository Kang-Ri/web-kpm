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
// 3. SINKRONISASI (DISABLED - Use Manual Migrations!)
// ==========================================================
// CRITICAL: sequelize.sync({ alter: true }) causes duplicate indexes!
// MySQL has max 64 indexes per table limit.
// Use manual migrations instead for schema changes.

// ❌ DISABLED TO PREVENT ER_TOO_MANY_KEYS ERROR
// sequelize.sync({ alter: true })
//     .then(() => {
//         console.log('Database & tabel berhasil disinkronkan. Semua asosiasi telah aktif!');
//     })
//     .catch(err => {
//         console.error('Error saat sinkronisasi database:', err);
//     });

console.log('✅ Database models loaded. Associations defined.');
console.log('📝 Use manual migrations for schema changes!');

module.exports = sequelize; // Ekspor instance sequelize