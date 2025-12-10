const { DataTypes } = require('sequelize');
// Asumsi path ini mengarah ke instance sequelize yang terinisialisasi
const sequelize = require('../../../db/sequelizeConfig'); 

/**
 * Model Form: merepresentasikan tabel 'form'
 * Berisi informasi dasar tentang formulir (idForm, namaForm, tglDibuat, dll.)
 */
const Form = sequelize.define('Form', {
    idForm: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        // field: 'idForm', // Dihapus karena nama atribut model sama dengan nama kolom DB
    },
    namaForm: { 
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Memastikan nama form unik
        // field: 'namaForm', // Dihapus karena nama atribut model sama dengan nama kolom DB
        validate: {
            notEmpty: { 
                msg: 'Nama Form tidak boleh kosong.' 
            },
            len: {
                args: [3, 255],
                msg: 'Nama Form harus memiliki panjang antara 3 dan 255 karakter.'
            }
        }
    },
    descForm: {
        type: DataTypes.TEXT,
        allowNull: true, // Deskripsi bisa kosong
        // Catatan: Pastikan kolom 'deskripsi' ada di tabel DB Anda
    },
    tglDibuat: { 
        type: DataTypes.DATE,
        allowNull: true, // Di DB screenshot Anda tglDibuat adalah nullable
        defaultValue: DataTypes.NOW, // Nilai default akan diatur oleh Sequelize/DB
        // field: 'tglDibuat', // Dihapus karena nama atribut model sama dengan nama kolom DB
    },
    statusForm: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif', 'Draft'),
        defaultValue: 'Draft',
        allowNull: false,
        // Catatan: Pastikan kolom 'status' ada di tabel DB Anda
    },
}, {
    timestamps: false, // Tidak menggunakan createdAt dan updatedAt
    tableName: 'form', 
    // freezeTableName: true // Opsional: Memastikan Sequelize tidak mengubah nama tabel
});

module.exports = Form;