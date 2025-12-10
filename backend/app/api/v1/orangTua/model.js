const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const OrangTua = sequelize.define('OrangTua', {
    idOrangTua: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idSiswa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK ke siswa',
    },

    // Data Ayah
    namaAyah: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    pekerjaanAyah: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    noHpAyah: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },

    // Data Ibu
    namaIbu: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    pekerjaanIbu: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    noHpIbu: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },

    // Data Wali (optional)
    namaWali: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    hubunganWali: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    noHpWali: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
}, {
    tableName: 'orangTua',
    timestamps: true,
    underscored: false,
    indexes: [
        {
            fields: ['idSiswa'],
        }
    ]
});

module.exports = OrangTua;
