const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const VariableTemplate = sequelize.define('VariableTemplate', {
    idTemplate: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    namaVariable: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique variable name (e.g. nama_lengkap)'
    },
    label: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Display label for dropdown'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional description/hint'
    },
    category: {
        type: DataTypes.ENUM('personal', 'academic', 'contact', 'other'),
        defaultValue: 'other',
        comment: 'Grouping category'
    },
    color: {
        type: DataTypes.STRING(7),
        defaultValue: '#6B7280',
        comment: 'Hex color for visual coding'
    },
    orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Display order in dropdown'
    }
}, {
    timestamps: true,
    tableName: 'variableTemplates',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = VariableTemplate;
