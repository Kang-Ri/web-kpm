const { NotFoundError, BadRequestError } = require('../../errors'); // Asumsi path error benar
const { Op } = require('sequelize');

// Sesuaikan path import model agar sesuai dengan struktur umum:
const Form = require('../../api/v1/forms/model');
const Product = require('../../api/v1/product/model'); // Asumsi path model Product benar
const FormField = require('../../api/v1/formFields/model');

const productInclude = {
    model: Product,
    as: 'products', // Menggunakan alias 'customForm' sesuai association.js
    attributes: ['idProduk', 'namaProduk', 'hargaModal', 'hargaJual'],
    required: false, // Gunakan false (LEFT JOIN) agar Product tetap muncul meskipun idFormOrder NULL
};

// --- 1. CREATE FORM (create) ---
const createForm = async (req) => {
    // Gunakan nama atribut model yang benar: deskripsi (bukan descForm) dan status (bukan statusForm)
    const {
        namaForm,
        descForm, // Diubah dari descForm
        statusForm // Diubah dari statusForm
    } = req.body;

    // 1. Validasi Input Dasar
    if (!namaForm) {
        throw new BadRequestError('Nama Form wajib diisi.');
    }

    // 2. Cek Duplikasi Nama Form
    const checkName = await Form.findOne({ where: { namaForm } });
    if (checkName) {
        throw new BadRequestError('Nama Form sudah terdaftar.');
    }

    // 3. Buat Form
    const newForm = await Form.create({
        namaForm,
        descForm, // Menggunakan nama atribut model
        statusForm: statusForm || 'Draft', // Default status, menggunakan nama atribut model
        // tglDibuat dihandle oleh defaultValue: DataTypes.NOW di model, tidak perlu di sini
    });

    // PERHATIAN: Di sini, Anda akan menambahkan FormField di masa depan.

    return newForm;
};

// --- 2. GET ALL FORMS (readAll) ---
const getAllForms = async () => {
    // Hanya mengambil data Form. Kita tidak perlu menyebutkan atribut jika ingin mengambil semua:
    const result = await Form.findAll({
        // Sesuaikan nama atribut sesuai Model: deskripsi dan status
        attributes: ['idForm', 'namaForm', 'descForm', 'statusForm', 'tglDibuat'],
        include: [
            productInclude,
            {
                model: FormField,
                as: 'fields',
                order: [['orderIndex', 'ASC']]
            }
        ],
        order: [['idForm', 'DESC']],
        // Di masa depan, di sini Anda bisa menambahkan 'include: [FormField]'
    });

    return result;
};

// --- 3. GET ONE FORM DETAIL (readOne) ---
// Controller akan meneruskan idForm (bukan req)
const getFormDetail = async (idForm) => {
    // Hanya mengambil data Form tanpa FormField
    const result = await Form.findOne({
        where: { idForm: idForm },
        include: [
            productInclude,
            {
                model: FormField,
                as: 'fields',
                order: [['orderIndex', 'ASC']]
            }
        ],
        // Di masa depan, di sini Anda bisa menambahkan 'include: [FormField]'
    });

    if (!result) {
        throw new NotFoundError(`Form dengan ID: ${idForm} tidak ditemukan.`);
    }

    return result;
};

// --- 4. UPDATE STATUS FORM (update) ---
// Controller akan meneruskan idForm dan data update (bukan req)
const updateForm = async (idForm, data) => {
    // Gunakan nama atribut model yang benar: deskripsi (bukan descForm) dan status (bukan statusForm)
    const { namaForm, descForm, statusForm } = data;

    // 1. Cek Keberadaan Form
    const checkForm = await Form.findOne({ where: { idForm: idForm } });
    if (!checkForm) {
        throw new NotFoundError(`Form dengan ID: ${idForm} tidak ditemukan.`);
    }

    // 2. Cek Duplikasi Nama Form (kecuali form itu sendiri)
    if (namaForm && namaForm !== checkForm.namaForm) {
        const checkName = await Form.findOne({
            where: {
                namaForm,
                idForm: { [Op.ne]: idForm } // Gunakan Op dari sequelize
            }
        });
        if (checkName) {
            throw new BadRequestError('Nama Form sudah terdaftar di form lain.');
        }
    }

    // 3. Update Form
    await checkForm.update({
        namaForm,
        descForm,
        statusForm
    });

    // 4. Dapatkan data yang sudah di-update
    // Panggil getFormDetail dengan ID yang sudah pasti
    const updatedForm = await getFormDetail(idForm);
    return updatedForm;
};

// 5. DELETE FORM
// Controller akan meneruskan idForm (bukan req)
const deleteForm = async (idForm) => {
    // 1. Cek Keberadaan Form
    const result = await Form.findOne({ where: { idForm } });

    if (!result) {
        throw new NotFoundError(`Form dengan ID: ${idForm} tidak ditemukan.`);
    }

    // 2. Hapus Product Foreign Key (SET NULL)
    // Lakukan update Product dulu (SET NULL) sebelum menghapus Form
    await Product.update({ idForm: null }, { where: { idForm: idForm } });

    // 3. Hapus Form itu sendiri
    await Form.destroy({ where: { idForm } });

    return result; // Mengembalikan objek yang dihapus (praktik umum)
}

// EXPORT SEMUA FUNGSI
module.exports = {
    createForm,
    getAllForms,
    getFormDetail,
    updateForm,
    deleteForm,
};