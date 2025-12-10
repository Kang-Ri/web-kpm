const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig'); 

const FormField = sequelize.define('FormField', {
    idField: { // Sesuai DB: idField
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'idField',
    },
    // --- FOREIGN KEY ke Form ---
    idForm: { // Sesuai DB: idForm
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'idForm', 
    },
    // --- DATA FIELD ---
    namaField: { // Sesuai DB: namaField (Unique key per form)
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'namaField',
        comment: 'Nama variabel unik (misal: "nama_lengkap"). Harus unik per form.'
    },
    tipeField: { // Sesuai DB: tipeField (menggantikan inputType)
        type: DataTypes.ENUM(
            'text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date'
        ),
        allowNull: false,
        field: 'tipeField',
    },
    nilaiPilihan: { // Sesuai DB: nilaiPilihan (menggantikan options)
        type: DataTypes.TEXT, 
        allowNull: true,
        field: 'nilaiPilihan',
        comment: 'Pilihan (options) field, biasanya disimpan sebagai JSON string.'
    },
    required: { // Sesuai DB: required (menggantikan isRequired)
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'required',
    },
    textDescription: { // Sesuai DB: textDescription
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'textDescription',
        comment: 'Teks deskripsi untuk user (Label).'
    },
    textWarning: { // Sesuai DB: textWarning
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'textWarning',
        comment: 'Pesan error/warning jika validasi gagal.'
    },
    placeholder: { // Sesuai DB: placeholder
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'placeholder',
    },
    orderIndex: { // Sesuai DB: orderIndex (menggantikan urutan)
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'orderIndex',
    }
}, {
    timestamps: false, 
    tableName: 'formfield', // Sesuai DB: formfield
    indexes: [
        // Indeks untuk memastikan 'namaField' unik dalam lingkup 'idForm'
        {
            unique: true,
            fields: ['idForm', 'namaField']
        }
    ]
});

module.exports = FormField;