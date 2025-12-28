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

// --- 6. SUBMIT FORM (submitForm) ---
const submitForm = async (idForm, idSiswa, responses, idSiswaKelas = null) => {
    // 1. Validasi Form exists & active
    const form = await Form.findOne({
        where: { idForm },
        include: [
            {
                model: FormField,
                as: 'fields',
                attributes: ['idField', 'namaField', 'tipeField', 'required', 'nilaiPilihan']
            }
        ]
    });

    if (!form) {
        throw new NotFoundError(`Form dengan ID ${idForm} tidak ditemukan.`);
    }

    if (form.statusForm !== 'Aktif') {
        throw new BadRequestError('Form sudah tidak aktif.');
    }

    // 2. Validasi semua required fields terisi
    const requiredFields = form.fields.filter(f => f.required);
    for (const field of requiredFields) {
        if (!responses[field.namaField] || responses[field.namaField] === '') {
            throw new BadRequestError(`Field "${field.namaField}" wajib diisi.`);
        }
    }

    // 3. Validasi format email
    for (const field of form.fields) {
        if (field.tipeField === 'email' && responses[field.namaField]) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(responses[field.namaField])) {
                throw new BadRequestError(`Format email pada field "${field.namaField}" tidak valid.`);
            }
        }
    }

    // 4. Get harga daftar ulang if idSiswaKelas provided
    let hargaDaftarUlang = 0;
    let namaKelas = 'Form Submission';

    if (idSiswaKelas) {
        const SiswaKelas = require('../../api/v1/siswaKelas/model');
        const ParentProduct2 = require('../../api/v1/parentProduct2/model');

        const siswaKelas = await SiswaKelas.findOne({
            where: { idSiswaKelas },
            include: [{
                model: ParentProduct2,
                as: 'parentProduct2',
                attributes: ['hargaDaftarUlang', 'kategoriHargaDaftarUlang']
            }]
        });

        if (siswaKelas?.parentProduct2) {
            hargaDaftarUlang = siswaKelas.parentProduct2.hargaDaftarUlang || 0;
            namaKelas = `Daftar Ulang - ${form.namaForm}`;
        }
    }

    // 5. Create Order
    const Order = require('../../api/v1/order/model');
    const newOrder = await Order.create({
        idSiswa,
        idProduk: null,
        namaProduk: namaKelas,
        hargaProduk: hargaDaftarUlang,
        namaPembeli: responses.namaLengkap || responses.nama_lengkap || responses.nama || 'Unknown',
        emailPembeli: responses.email || 'no-email@form-submission.com',
        noHpPembeli: responses.noHp || responses.no_hp || responses.telepon || '0000000000',
        jumlahBeli: 1,
        hargaTransaksi: hargaDaftarUlang,
        diskon: 0,
        hargaFinal: hargaDaftarUlang,
        statusOrder: 'Pending',
        statusPembayaran: hargaDaftarUlang > 0 ? 'Belum Lunas' : 'Lunas',
        paymentMethod: null,
        tglOrder: new Date()
    });

    // 6. Link Order to SiswaKelas
    if (idSiswaKelas) {
        const SiswaKelas = require('../../api/v1/siswaKelas/model');
        await SiswaKelas.update(
            { idOrderDaftarUlang: newOrder.idOrder },
            { where: { idSiswaKelas } }
        );
    }

    // 7. Save ALL responses as single JSON object
    const OrderFormResponse = require('../../api/v1/orderFormResponses/model');

    await OrderFormResponse.create({
        idOrder: newOrder.idOrder,
        idField: null,
        responseValue: JSON.stringify(responses)
    });

    return {
        idOrder: newOrder.idOrder,
        statusOrder: newOrder.statusOrder,
        statusPembayaran: newOrder.statusPembayaran,
        hargaFinal: newOrder.hargaFinal,
        needsPayment: hargaDaftarUlang > 0,
        formData: responses
    };
};

// --- 7. DUPLICATE FORM (duplicateForm) ---
const duplicateForm = async (idForm, newName = null) => {
    const originalForm = await Form.findOne({
        where: { idForm },
        include: [{ model: FormField, as: 'fields', attributes: { exclude: ['idField'] } }]
    });

    if (!originalForm) throw new NotFoundError(`Form dengan ID ${idForm} tidak ditemukan.`);

    const duplicatedForm = await Form.create({
        namaForm: newName || `${originalForm.namaForm} (Copy)`,
        descForm: originalForm.descForm,
        statusForm: 'Draft'
    });

    if (originalForm.fields && originalForm.fields.length > 0) {
        const fieldsData = originalForm.fields.map(field => ({
            idForm: duplicatedForm.idForm,
            namaField: field.namaField,
            tipeField: field.tipeField,
            nilaiPilihan: field.nilaiPilihan,
            required: field.required,
            textDescription: field.textDescription,
            textWarning: field.textWarning,
            placeholder: field.placeholder,
            orderIndex: field.orderIndex
        }));
        await FormField.bulkCreate(fieldsData);
    }

    return await Form.findOne({
        where: { idForm: duplicatedForm.idForm },
        include: [{ model: FormField, as: 'fields' }]
    });
};

// EXPORT SEMUA FUNGSI
module.exports = {
    createForm,
    getAllForms,
    getFormDetail,
    updateForm,
    deleteForm,
    submitForm,
    duplicateForm,
};