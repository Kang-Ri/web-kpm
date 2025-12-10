const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const AksesMateri = sequelize.define('AksesMateri', {
    idAkses: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idSiswa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK ke siswa',
    },
    idProduk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK ke product (materi)',
    },
    idOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK ke order (jika berbayar)',
    },

    statusAkses: {
        type: DataTypes.ENUM('Locked', 'Unlocked'),
        defaultValue: 'Locked',
    },
    tanggalAkses: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Kapan akses diberikan',
    },
}, {
    tableName: 'aksesMateri',
    timestamps: true,
    underscored: false,
    indexes: [
        {
            unique: true,
            fields: ['idSiswa', 'idProduk'],
        },
        {
            fields: ['idSiswa'],
        },
        {
            fields: ['idProduk'],
        },
        {
            fields: ['statusAkses'],
        }
    ]
});

module.exports = AksesMateri;
