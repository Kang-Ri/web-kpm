const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const SiswaKelas = sequelize.define('SiswaKelas', {
    idSiswaKelas: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idSiswa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK ke siswa',
    },
    idParent2: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK ke parentProduct2 (Ruang Kelas)',
    },

    // Status Daftar Ulang
    sudahDaftarUlang: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    idOrderDaftarUlang: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK ke order (jika berbayar)',
    },
    tanggalDaftarUlang: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    // Status Enrollment
    statusEnrollment: {
        type: DataTypes.ENUM('Pending', 'Aktif', 'Lulus', 'Dropout'),
        defaultValue: 'Pending',
    },
    tanggalMasuk: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    tanggalKeluar: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'siswaKelas',
    timestamps: true,
    underscored: false,
    indexes: [
        {
            unique: true,
            fields: ['idSiswa', 'idParent2'],
        },
        {
            fields: ['idSiswa'],
        },
        {
            fields: ['idParent2'],
        },
        {
            fields: ['statusEnrollment'],
        }
    ]
});

module.exports = SiswaKelas;
