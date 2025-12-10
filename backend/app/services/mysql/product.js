const Product = require('../../api/v1/product/model');
const ParentProduct2 = require('../../api/v1/parentProduct2/model');
const Form = require('../../api/v1/forms/model'); // Import model Form
const { NotFoundError, BadRequestError } = require('../../errors');

// Helper untuk validasi ParentProduct2
const checkingParentProduct2 = async (idParent2) => {
    const checkParent2 = await ParentProduct2.findOne({
        where: { idParent2 },
    });

    if (!checkParent2) {
        throw new NotFoundError(`ID ParentProduct2: ${idParent2} tidak ditemukan.`);
    }
};

// Helper untuk validasi Form (OrderForm)
const checkingFormOrder = async (idForm) => {
    // idForm bisa null, jadi hanya cek jika nilainya ada
    if (idForm) {
        const checkForm = await Form.findOne({
            where: { idForm: idForm }
        });

        if (!checkForm) {
            throw new NotFoundError(`ID Form Order: ${idForm} tidak ditemukan.`);
        }
    }
};

// Konfigurasi Include untuk Form
const formInclude = {
    model: Form,
    as: 'customForm', // Menggunakan alias 'customForm' sesuai association.js
    attributes: ['idForm', 'namaForm', 'descForm', 'statusForm'],
    required: false, // Gunakan false (LEFT JOIN) agar Product tetap muncul meskipun idForm NULL
};

// --- 1. GET ALL PRODUCT (readAll) ---
const getAllProduct = async (req) => {
    const result = await Product.findAll({
        attributes: { exclude: ['idParent1', 'idForm'] }, // Tambahkan idForm ke daftar exclude
        include: [
            {
                model: ParentProduct2,
                as: "parentProduct2",
                attributes: ['idParent2', 'namaParent2'],
            },
            // Menambahkan include untuk Form Order
            formInclude,
        ],
        order: [['idProduk', 'DESC']],
    });
    return result;
};

// --- 2. GET ONE PRODUCT (readOne) ---
const getOneProduct = async (req) => {
    const { id } = req.params;

    const result = await Product.findOne({
        where: { idProduk: id },
        attributes: { exclude: ['idParent1', 'idForm'] }, // Tambahkan idForm ke daftar exclude
        include: [
            {
                model: ParentProduct2,
                as: "parentProduct2",
                attributes: ['idParent2', 'namaParent2'],
            },
            // Menambahkan include untuk Form Order
            formInclude,
        ],
    });

    if (!result) {
        throw new NotFoundError(`Produk dengan ID: ${id} tidak ditemukan.`);
    }

    return result;
};

// --- 3. CREATE PRODUCT (create) ---
const createProduct = async (req) => {
    const {
        idParent2,
        namaProduk,
        descProduk,
        kategoriHarga,
        hargaModal,
        hargaJual,
        jenisProduk,
        authProduk,
        idForm, // Menerima FK Form
        refCode,
        statusProduk
    } = req.body;

    // 1. Cek keberadaan ParentProduct2
    await checkingParentProduct2(idParent2);

    // 2. Cek keberadaan Form Order (jika idForm diisi)
    await checkingFormOrder(idForm);

    // 3. Cek duplikasi namaProduk
    const checkName = await Product.findOne({ where: { namaProduk } });
    if (checkName) {
        throw new BadRequestError('Nama Produk sudah terdaftar.');
    }

    // 4. Validasi Logika Harga
    if (kategoriHarga === 'Bernominal' && (!hargaJual || hargaJual <= 0)) {
        throw new BadRequestError('Harga Jual wajib diisi dan harus lebih dari 0 jika Kategori Harga adalah Bernominal.');
    }

    const result = await Product.create({
        idParent2,
        namaProduk,
        descProduk,
        kategoriHarga,
        hargaModal,
        hargaJual,
        jenisProduk,
        authProduk,
        idForm: idForm || null, // Pastikan tersimpan NULL jika kosong
        refCode,
        statusProduk
    });

    return result;
};

// --- 4. UPDATE PRODUCT (update) - Disesuaikan untuk PATCH ---
const updateProduct = async (req) => {
    const { id } = req.params;
    const updateFields = req.body;

    // 1. Pengecekan Keberadaan Product
    const current = await getOneProduct(req);

    // 2. Jika idParent2 disertakan, cek keberadaannya
    if (updateFields.idParent2) {
        await checkingParentProduct2(updateFields.idParent2);
    }

    // 3. Jika idForm disertakan, cek keberadaannya
    if (Object.prototype.hasOwnProperty.call(updateFields, 'idForm')) {
        await checkingFormOrder(updateFields.idForm);
    }


    // 4. Pengecekan Duplikasi Nama (Hanya jika namaProduk disertakan)
    if (updateFields.namaProduk) {
        const checkName = await Product.findOne({
            where: {
                namaProduk: updateFields.namaProduk,
                idProduk: { [Product.sequelize.Op.ne]: id } // Kecuali ID yang sedang diupdate
            },
        });

        if (checkName) {
            throw new BadRequestError('Nama Produk sudah terdaftar di entitas lain.');
        }
    }

    // 5. Update Database
    await Product.update(updateFields, {
        where: { idProduk: id }
    });

    // 6. Dapatkan data yang sudah di-update
    return getOneProduct(req);
};

// --- 5. DELETE PRODUCT (destroy) ---
const deleteProduct = async (req) => {
    const { id } = req.params;

    // Menggunakan findOne biasa karena data ParentProduct2/Form tidak diperlukan untuk proses destroy
    const result = await Product.findOne({
        where: { idProduk: id },
    });

    if (!result) {
        throw new NotFoundError(`Produk dengan ID: ${id} tidak ditemukan.`);
    }

    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    getAllProduct,
    getOneProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};