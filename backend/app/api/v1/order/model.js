// File: app/api/v1/order/model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const Order = sequelize.define('Order', {
    idOrder: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },

    // === FOREIGN KEYS (Nullable untuk historical data) ===
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK ke Users (nullable jika user dihapus)'
    },
    idProduk: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK ke Product (nullable jika produk dihapus)'
    },

    // === SNAPSHOT DATA PRODUK ===
    namaProduk: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Snapshot nama produk saat order dibuat'
    },
    hargaProduk: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Snapshot harga produk saat order dibuat'
    },

    // === SNAPSHOT DATA PEMBELI ===
    namaPembeli: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Nama pembeli (dari form response)'
    },
    emailPembeli: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Email pembeli (dari form response)'
    },
    noHpPembeli: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'No HP pembeli (dari form response)'
    },

    // === DATA TRANSAKSI ===
    jumlahBeli: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Jumlah produk yang dibeli'
    },
    hargaTransaksi: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total harga sebelum diskon'
    },
    diskon: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Diskon yang diberikan'
    },
    hargaFinal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Harga final setelah diskon'
    },

    // === STATUS ===
    statusOrder: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'),
        defaultValue: 'Pending',
        comment: 'Status order'
    },
    statusPembayaran: {
        type: DataTypes.ENUM('Unpaid', 'Paid', 'Refunded', 'Failed'),
        defaultValue: 'Unpaid',
        comment: 'Status pembayaran'
    },

    // === PAYMENT GATEWAY ===
    midtransTransactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'ID transaksi dari Midtrans'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Metode pembayaran (Transfer, E-wallet, dll)'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Waktu pembayaran berhasil'
    },

    // === TIMESTAMPS ===
    tglOrder: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Tanggal order dibuat (immutable)'
    },
}, {
    timestamps: true,
    tableName: 'order',
});

module.exports = Order;