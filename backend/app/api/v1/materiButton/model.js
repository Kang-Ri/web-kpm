const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const MateriButton = sequelize.define('MateriButton', {
    idButton: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idProduk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK ke product (materi)',
    },

    namaButton: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nama tombol CTA',
    },
    linkTujuan: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'URL tujuan',
    },
    deskripsiButton: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Deskripsi tombol',
    },

    // Scheduling
    tanggalPublish: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Kapan tombol mulai aktif',
    },
    tanggalExpire: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Kapan tombol tidak aktif (optional)',
    },
    statusButton: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
    },

    orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Urutan tombol',
    },
}, {
    tableName: 'materiButton',
    timestamps: true,
    underscored: false,
    indexes: [
        {
            fields: ['idProduk'],
        },
        {
            fields: ['statusButton'],
        },
        {
            fields: ['tanggalPublish'],
        }
    ]
});

module.exports = MateriButton;
