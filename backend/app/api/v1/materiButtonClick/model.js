const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const MateriButtonClick = sequelize.define('MateriButtonClick', {
    idClick: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idButton: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK to materiButton',
    },
    idSiswa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK to siswa',
    },
    tanggalKlik: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        comment: 'When the button was clicked',
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Optional: IP address of user',
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional: Browser user agent',
    },
}, {
    tableName: 'materiButtonClick',
    timestamps: false, // We have manual tanggalKlik
    underscored: false,
    indexes: [
        {
            fields: ['idButton'],
            name: 'idx_button'
        },
        {
            fields: ['idSiswa'],
            name: 'idx_siswa'
        },
        {
            fields: ['tanggalKlik'],
            name: 'idx_tanggal'
        },
        {
            fields: ['idButton', 'idSiswa'],
            name: 'idx_button_siswa'
        }
    ]
});

module.exports = MateriButtonClick;
