const { DataTypes } = require('sequelize');
// Sesuaikan path ke sequelizeConfig
const sequelize = require('../../../db/sequelizeConfig');

// HAPUS: const ParentProduct1 = require('../parentProduct1/model'); // HINDARI CIRCULAR DEPENDENCY

const ParentProduct2 = sequelize.define('ParentProduct2', {
    idParent2: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // HANYA DEFINISIKAN Foreign Key (FK) sebagai kolom biasa
    // JANGAN GUNAKAN properti 'references' di sini
    idParent1: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // HAPUS properti 'references' (ini akan didefinisikan di associations.js)
        /*
        references: {
            model: ParentProduct1, // Memicu Circular Dependency
            key: 'idParent1',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        */
    },
    namaParent2: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Nama Parent Product 2 tidak boleh kosong.' },
        }
    },
    descParent2: {
        type: DataTypes.TEXT,
    },
    tglPublish: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.ENUM('Aktif', 'Non-Aktif'),
        defaultValue: 'Non-Aktif',
    },
    tautanProduk: {
        type: DataTypes.ENUM('Kelas Periodik', 'Kelas Insidental', 'Produk Komersial', '-'),
        defaultValue: '-',
    },

    // Pengaturan Daftar Ulang (untuk LMS)
    daftarUlangAktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Apakah daftar ulang diaktifkan',
    },
    kategoriHargaDaftarUlang: {
        type: DataTypes.ENUM('Gratis', 'Seikhlasnya', 'Bernominal'),
        defaultValue: 'Gratis',
    },
    hargaDaftarUlang: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Harga daftar ulang',
    },

    // Pengaturan Kelas (optional)
    tahunAjaran: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Tahun ajaran untuk kelas',
    },
    kapasitasMaksimal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Kapasitas maksimal siswa',
    },

    // Jenjang Kelas yang Diperbolehkan (Array of strings: ["1","2",...,"12"])
    jenjangKelasIzin: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array jenjang kelas yang diperbolehkan: ["1","2",...,"12"]',
    },
}, {
    timestamps: false,
    tableName: 'ParentProduct2'
});


module.exports = ParentProduct2;