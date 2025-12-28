const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const OrderFormResponse = sequelize.define('OrderFormResponse', {
    idResponse: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'idResponse',
    },
    idOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'idOrder',
    },
    idField: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow NULL for JSON response storage (idField=null, all data in nilaiJawaban)
        field: 'idField',
    },
    nilaiJawaban: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'nilaiJawaban',
    },
}, {
    tableName: 'orderformresponse',
    timestamps: false,
    underscored: false,
    indexes: [
        {
            unique: true,
            fields: ['idOrder', 'idField'],
        }
    ]
});

module.exports = OrderFormResponse;