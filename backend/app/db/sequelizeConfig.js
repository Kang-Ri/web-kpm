const { Sequelize } = require('sequelize');
require("dotenv").config();

// Menggunakan konfigurasi dari .env Anda
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Set true jika ingin melihat SQL di konsol
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Pengecekan koneksi
sequelize.authenticate()
    .then(() => {
        console.log('Koneksi Database Sequelize berhasil.');
    })
    .catch(err => {
        console.error('Gagal koneksi Database Sequelize:', err);
    });

module.exports = sequelize;