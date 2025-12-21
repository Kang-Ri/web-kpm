const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const Users = sequelize.define('Users', {
    idUser: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    namaLengkap: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    noHp: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    idRole: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
        defaultValue: 'Aktif',
    },
}, {
    timestamps: false,
    tableName: 'Users',
});


module.exports = Users;