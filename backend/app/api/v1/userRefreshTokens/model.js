const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig'); 

const RefreshTokens = sequelize.define('RefreshTokens', {
    idRefreshToken: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Hanya boleh ada 1 Refresh Token aktif per user
    },
    token: {
        type: DataTypes.TEXT, // Simpan token hash
        allowNull: false,
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: false, 
    // PERBAIKAN: Menggunakan nama tabel yang dikonfirmasi (huruf kecil)
    tableName: 'refreshtokens', 
});

module.exports = RefreshTokens;