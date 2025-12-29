const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const Product = sequelize.define('Product', {
    idProduk: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    // Foreign Key ke ParentProduct2
    // Biarkan sebagai kolom INTEGER biasa, HAPUS properti references
    idParent2: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    namaProduk: {
        type: DataTypes.STRING(255),
        allowNull: false,
        // REMOVE global unique - akan diganti dengan composite unique index
        validate: {
            notEmpty: {
                msg: 'Nama Produk tidak boleh kosong.'
            },
        }
    },
    descProduk: {
        type: DataTypes.TEXT,
    },
    kategoriHarga: {
        type: DataTypes.ENUM('Gratis', 'Seikhlasnya', 'Bernominal'),
        defaultValue: 'Bernominal',
    },
    hargaModal: {
        type: DataTypes.DECIMAL(10, 2), // Menyimpan harga modal dengan 2 desimal
        allowNull: true, // Bisa null jika kategoriHarga Gratis/Seikhlasnya
        defaultValue: 0.00,
    },
    hargaJual: {
        type: DataTypes.DECIMAL(10, 2), // Menyimpan harga jual dengan 2 desimal
        allowNull: true,
        defaultValue: 0.00,
    },
    jenisProduk: {
        type: DataTypes.ENUM('Materi', 'Produk', 'Daftar Ulang', 'Lainnya'),
        defaultValue: 'Produk',
    },
    authProduk: {
        type: DataTypes.ENUM('Umum', 'Khusus'),
        defaultValue: 'Umum',
    },
    idForm: { // Foreign Key ke Order Form (asumsi tabel Form sudah ada/akan dibuat)
        type: DataTypes.INTEGER,
        allowNull: true, // Bisa null jika tidak ada order form
    },
    refCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    statusProduk: {
        type: DataTypes.ENUM('Draft', 'Publish', 'Non-Aktif'),
        defaultValue: 'Draft',
    },
    tanggalPublish: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Tanggal publish materi',
    },
}, {
    timestamps: false,
    tableName: 'product', // Pastikan nama tabel di database adalah 'product'
    indexes: [
        {
            unique: true,
            fields: ['namaProduk', 'idParent2'],
            name: 'unique_product_per_parent2'
        }
    ]
});

// Catatan: Asosiasi model (belongsTo) ke ParentProduct2 sudah dipindahkan ke app/db/associations.js

module.exports = Product;