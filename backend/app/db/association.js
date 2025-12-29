// Form Models (Penambahan)
const Form = require('../api/v1/forms/model');
const FormField = require('../api/v1/formFields/model');
const OrderFormResponse = require('../api/v1/orderFormResponses/model');
const Order = require('../api/v1/order/model');

// Produk Models
const ParentProduct1 = require('../api/v1/parentProduct1/model');
const ParentProduct2 = require('../api/v1/parentProduct2/model');
const Product = require('../api/v1/product/model');

// Users & Auth Models
const Users = require('../api/v1/users/model');
const Roles = require('../api/v1/roles/model');
const UserRefreshToken = require('../api/v1/userRefreshTokens/model');

// LMS Models (New)
const Siswa = require('../api/v1/siswa/model');
const OrangTua = require('../api/v1/orangTua/model');
const SiswaKelas = require('../api/v1/siswaKelas/model');
const MateriButton = require('../api/v1/materiButton/model');
const AksesMateri = require('../api/v1/aksesMateri/model');
const MateriButtonClick = require('../api/v1/materiButtonClick/model');

// Variable Templates (for form builder)
const VariableTemplate = require('../api/v1/variableTemplates/model');


/**
 * Fungsi untuk mendefinisikan semua asosiasi model (Relasi Database).
 * Dipanggil SATU KALI di app/db/index.js setelah semua model diimpor.
 */
const defineAssociations = () => {
    console.log("Mendefinisikan semua asosiasi model...");

    // --------------------------------------------------
    // A. USERS & AUTH ASSOCIATIONS
    // --------------------------------------------------

    // 1. Relasi Users <-> Roles (One-to-Many)
    Users.belongsTo(Roles, {
        foreignKey: 'idRole',
        as: 'role'
    });

    Roles.hasMany(Users, {
        foreignKey: 'idRole',
        as: 'users'
    });

    // 2. Relasi Users <-> UserRefreshToken (One-to-Many)
    UserRefreshToken.belongsTo(Users, {
        foreignKey: 'idUser',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    Users.hasMany(UserRefreshToken, {
        foreignKey: 'idUser',
        as: 'refreshTokens',
    });


    // --------------------------------------------------
    // B. PRODUCT ASSOCIATIONS (Fix Circular Dependency)
    // --------------------------------------------------

    // 3. Relasi ParentProduct1 <-> ParentProduct2 (One-to-Many)
    ParentProduct2.belongsTo(ParentProduct1, {
        foreignKey: 'idParent1',
        as: 'parentProduct1',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    ParentProduct1.hasMany(ParentProduct2, {
        foreignKey: 'idParent1',
        as: 'parentProduct2s',
    });

    // 4. Relasi ParentProduct2 <-> Product (One-to-Many)
    Product.belongsTo(ParentProduct2, {
        foreignKey: 'idParent2',
        as: 'parentProduct2',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    ParentProduct2.hasMany(Product, {
        foreignKey: 'idParent2',
        as: 'products',
    });

    // --------------------------------------------------
    // C. FORM BUILDER & PRODUCT ASSOCIATIONS
    // --------------------------------------------------

    // 5. Relasi Form <-> FormField (One-to-Many)
    Form.hasMany(FormField, {
        foreignKey: 'idForm',
        as: 'fields',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    FormField.belongsTo(Form, {
        foreignKey: 'idForm',
        as: 'form'
    });

    // 6. Relasi Product <-> Form (One-to-One/Many)
    Product.belongsTo(Form, {
        foreignKey: 'idForm',
        as: 'customForm',
        allowNull: true,
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });

    Form.hasMany(Product, {
        foreignKey: 'idForm',
        as: 'products'
    });

    // 7. Relasi OrderFormResponse <-> FormField (One-to-Many)
    OrderFormResponse.belongsTo(FormField, {
        foreignKey: 'idField',
        as: 'formField'
    });

    FormField.hasMany(OrderFormResponse, {
        foreignKey: 'idField',
        as: 'responses'
    });

    // 8. Relasi Order <-> Users (Many-to-One)
    Order.belongsTo(Users, {
        foreignKey: 'idUser',
        as: 'user',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });
    Users.hasMany(Order, {
        foreignKey: 'idUser',
        as: 'orders'
    });

    // 9. Relasi Order <-> Product (Many-to-One)
    Order.belongsTo(Product, {
        foreignKey: 'idProduk',
        as: 'product',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });
    Product.hasMany(Order, {
        foreignKey: 'idProduk',
        as: 'orders'
    });

    // 10. Relasi Order <-> OrderFormResponse (One-to-Many)
    Order.hasMany(OrderFormResponse, {
        foreignKey: 'idOrder',
        as: 'formResponses',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    OrderFormResponse.belongsTo(Order, {
        foreignKey: 'idOrder',
        as: 'order'
    });

    // --------------------------------------------------
    // D. LMS ASSOCIATIONS (New)
    // --------------------------------------------------

    // 11. Relasi Siswa <-> Users (One-to-One)
    Siswa.belongsTo(Users, {
        foreignKey: 'idUser',
        as: 'user',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });
    Users.hasOne(Siswa, {
        foreignKey: 'idUser',
        as: 'siswa'
    });

    // 12. Relasi Siswa <-> OrangTua (One-to-One)
    OrangTua.belongsTo(Siswa, {
        foreignKey: 'idSiswa',
        as: 'siswa',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Siswa.hasOne(OrangTua, {
        foreignKey: 'idSiswa',
        as: 'orangTua'
    });

    // 13. Relasi SiswaKelas <-> Siswa (Many-to-One)
    SiswaKelas.belongsTo(Siswa, {
        foreignKey: 'idSiswa',
        as: 'siswa',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Siswa.hasMany(SiswaKelas, {
        foreignKey: 'idSiswa',
        as: 'kelasEnrollments'
    });

    // 14. Relasi SiswaKelas <-> ParentProduct2 (Many-to-One)
    SiswaKelas.belongsTo(ParentProduct2, {
        foreignKey: 'idParent2',
        as: 'parentProduct2', // Generic alias for all product types
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    ParentProduct2.hasMany(SiswaKelas, {
        foreignKey: 'idParent2',
        as: 'siswaEnrolled'
    });

    // 15. Relasi SiswaKelas <-> Order (Many-to-One)
    SiswaKelas.belongsTo(Order, {
        foreignKey: 'idOrderDaftarUlang',
        as: 'orderDaftarUlang',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });
    Order.hasMany(SiswaKelas, {
        foreignKey: 'idOrderDaftarUlang',
        as: 'enrollments'
    });

    // 16. Relasi MateriButton <-> Product (Many-to-One)
    MateriButton.belongsTo(Product, {
        foreignKey: 'idProduk',
        as: 'materi',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // 17. Relasi AksesMateri <-> Siswa (Many-to-One)
    AksesMateri.belongsTo(Siswa, {
        foreignKey: 'idSiswa',
        as: 'siswa',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Siswa.hasMany(AksesMateri, {
        foreignKey: 'idSiswa',
        as: 'aksesMateri'
    });

    // 18. Relasi AksesMateri <-> Product (Many-to-One)
    AksesMateri.belongsTo(Product, {
        foreignKey: 'idProduk',
        as: 'materi',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Product.hasMany(AksesMateri, {
        foreignKey: 'idProduk',
        as: 'aksesGiven'
    });

    // 19. Relasi AksesMateri <-> Order (Many-to-One)
    AksesMateri.belongsTo(Order, {
        foreignKey: 'idOrder',
        as: 'order',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });
    Order.hasMany(AksesMateri, {
        foreignKey: 'idOrder',
        as: 'materiAccess'
    });

    // 20. Relasi Product <-> MateriButton (One-to-Many)
    Product.hasMany(MateriButton, {
        foreignKey: 'idProduk',
        as: 'buttons',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    MateriButton.belongsTo(Product, {
        foreignKey: 'idProduk',
        as: 'product',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // 21. Relasi MateriButton <-> MateriButtonClick (One-to-Many)
    MateriButton.hasMany(MateriButtonClick, {
        foreignKey: 'idButton',
        as: 'clicks',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    MateriButtonClick.belongsTo(MateriButton, {
        foreignKey: 'idButton',
        as: 'button',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // 22. Relasi Siswa <-> MateriButtonClick (One-to-Many)
    Siswa.hasMany(MateriButtonClick, {
        foreignKey: 'idSiswa',
        as: 'buttonClicks',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    MateriButtonClick.belongsTo(Siswa, {
        foreignKey: 'idSiswa',
        as: 'siswa',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // --------------------------------------------------
    // STANDALONE MODELS (No Relations)
    // --------------------------------------------------
    // VariableTemplate - imported and registered above (line 25)

    console.log("Semua asosiasi model telah berhasil didefinisikan (22 relasi total).");
};

module.exports = { defineAssociations };