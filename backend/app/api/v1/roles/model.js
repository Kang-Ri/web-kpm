const { DataTypes } = require('sequelize');
const db = require('../../../db/sequelizeConfig'); // Mengimpor koneksi MySQL yang sudah Anda definisikan

const Roles = db.define('Roles', {
    // idRole: Primary Key dari tabel Roles
    idRole: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    // namaRole: Nama peran (misalnya 'Super Admin', 'Admin', 'Siswa')
    namaRole: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Nama peran harus unik
    },
    // Timestamp otomatis (createdAt dan updatedAt)
    // Sequelize secara default akan menambahkannya
}, {
    tableName: 'Roles', // Nama tabel yang sebenarnya di database Anda
    timestamps: true,
});

module.exports = Roles;