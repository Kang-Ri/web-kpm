const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const Siswa = sequelize.define('Siswa', {
    idSiswa: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK ke Users (nullable)',
    },

    // Data Umum
    namaLengkap: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    tempatLahir: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    tanggalLahir: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    jenisKelamin: {
        type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
        allowNull: true,
    },
    jenjangKelas: {
        type: DataTypes.ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'),
        allowNull: true,
        comment: 'Jenjang kelas siswa (1-12)',
    },
    asalSekolah: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Asal sekolah siswa',
    },
    agama: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },

    // Data Identitas
    nik: {
        type: DataTypes.STRING(16),
        allowNull: true,
        // unique: true, // REMOVED - already defined in indexes below
    },
    nisn: {
        type: DataTypes.STRING(10),
        allowNull: true,
        // unique: true, // REMOVED - already defined in indexes below
    },
    alamatLengkap: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    kota: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    provinsi: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    kodePos: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },

    // Data Kontak
    noHp: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },

    // Status
    statusAktif: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
        defaultValue: 'Aktif',
    },
}, {
    tableName: 'siswa',
    timestamps: true,
    underscored: false,
    indexes: [
        {
            fields: ['idUser'],
        },
        {
            unique: true,
            fields: ['nik'],
        },
        {
            unique: true,
            fields: ['nisn'],
        }
    ]
});

module.exports = Siswa;
