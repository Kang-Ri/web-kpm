const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig'); 
const Users = require('../users/model'); // Import Model Users

const PasswordResetTokens = sequelize.define('PasswordResetTokens', {
    idToken: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // Mendefinisikan Foreign Key ke tabel Users
        references: {
            model: Users, 
            key: 'idUser'
        },
    },
    token: {
        type: DataTypes.STRING(10), // Cukup untuk OTP 6 digit
        allowNull: false,
        unique: true, // Pastikan setiap token unik
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: false, // Asumsi Anda tidak memerlukan kolom createdAt/updatedAt
    tableName: 'PasswordResetTokens'
});

// Definisikan Relasi: PasswordResetTokens BELONGS TO Users
PasswordResetTokens.belongsTo(Users, { 
    foreignKey: 'idUser',
    onDelete: 'CASCADE' // Jika user dihapus, token reset juga dihapus
});

module.exports = PasswordResetTokens;