const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig'); // <-- Sesuaikan path

const ParentProduct1 = sequelize.define('ParentProduct1', {
    idParent1: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    namaParent1: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true, // Pastikan nama tidak duplikat
    },
    descParent1: {
        type: DataTypes.TEXT,
    },
    tglPublish: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
        defaultValue: 'Non-Aktif',
    },
    tautanProduk: {
        type: DataTypes.ENUM('Kelas Periodik', 'Kelas Insidental', 'Produk Komersial', '-'),
        defaultValue: '-',
    },
}, {
    // Sequelize secara default mencari kolom createdAt dan updatedAt.
    // Jika tabel Anda menggunakan nama ini, biarkan. Jika tidak, set timestamps: false
    timestamps: false, 
    tableName: 'ParentProduct1'
});

module.exports = ParentProduct1;