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

    // 4. Get harga daftar ulang from Product if idSiswaKelas provided
    let hargaDaftarUlang = 0;
    let namaKelas = 'Form Submission';
    let daftarUlangProduct = null;

    if (idSiswaKelas) {
        const SiswaKelas = require('../../api/v1/siswaKelas/model');
        const ParentProduct2 = require('../../api/v1/parentProduct2/model');
        const Product = require('../../api/v1/product/model');

        const siswaKelas = await SiswaKelas.findOne({
            where: { idSiswaKelas },
            include: [{
                model: ParentProduct2,
                as: 'parentProduct2',
                attributes: ['idParent2', 'namaParent2'],
                include: [{
                    model: Product,
                    as: 'products',
                    where: {
                        jenisProduk: 'Daftar Ulang',
                        statusProduk: 'Publish'
                    },
                    attributes: ['idProduk', 'namaProduk', 'kategoriHarga', 'hargaJual'],
                    required: false // LEFT JOIN - allow null if no Product
                }]
            }]
        });

        if (!siswaKelas) {
            throw new NotFoundError(`SiswaKelas dengan ID ${idSiswaKelas} tidak ditemukan.`);
        }

        // Get Daftar Ulang Product from ruang kelas
        if (siswaKelas.parentProduct2?.products && siswaKelas.parentProduct2.products.length > 0) {
            daftarUlangProduct = siswaKelas.parentProduct2.products[0];
            hargaDaftarUlang = daftarUlangProduct.hargaJual || 0;
            namaKelas = daftarUlangProduct.namaProduk;
        } else {
            // Fallback: no Product found, use form name
            namaKelas = `Daftar Ulang - ${form.namaForm}`;
        }
    }

    // 5. Create Order
    const Order = require('../../api/v1/order/model');
    const newOrder = await Order.create({
        idSiswa,
        idProduk: daftarUlangProduct?.idProduk || null, // Link to Product Daftar Ulang
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
        statusPembayaran: hargaDaftarUlang > 0 ? 'Unpaid' : 'Paid',
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

    // 7. Get complete user data for purchase history
    const Siswa = require('../../api/v1/siswa/model');
    const Users = require('../../api/v1/users/model');

    const siswaData = await Siswa.findOne({
        where: { idSiswa },
        include: [{
            model: Users,
            as: 'user',
            attributes: ['email']
        }]
    });

    // 8. Get product hierarchy for purchase history
    let productHierarchy = null;
    if (idSiswaKelas) {
        const SiswaKelas = require('../../api/v1/siswaKelas/model');
        const ParentProduct2 = require('../../api/v1/parentProduct2/model');
        const ParentProduct1 = require('../../api/v1/parentProduct1/model');

        const siswaKelas = await SiswaKelas.findOne({
            where: { idSiswaKelas },
            include: [{
                model: ParentProduct2,
                as: 'parentProduct2',
                attributes: ['namaParent2', 'idParent1'],
                include: [{
                    model: ParentProduct1,
                    as: 'parentProduct1',
                    attributes: ['namaParent1']
                }]
            }]
        });

        productHierarchy = {
            product: daftarUlangProduct?.namaProduk || null, // Product Daftar Ulang name
            parentProduct1: siswaKelas?.parentProduct2?.parentProduct1?.namaParent1 || null,
            parentProduct2: siswaKelas?.parentProduct2?.namaParent2 || null,
            productType: 'Daftar Ulang' // Changed from 'enrollment' to match jenisProduk
        };
    }

    // 9. Build enhanced JSON with metadata for purchase history
    const enhancedData = {
        _metadata: {
            idOrder: newOrder.idOrder,
            orderDate: newOrder.tglOrder.toISOString(),
            totalAmount: hargaDaftarUlang,
            paymentStatus: newOrder.statusPembayaran,
            productHierarchy,
            userAccount: {
                idSiswa: siswaData.idSiswa,
                idUser: siswaData.idUser,
                namaLengkap: siswaData.namaLengkap,
                email: siswaData.user?.email || responses.email || 'no-email@example.com',
                noHp: siswaData.noHp || responses.noHp || responses.no_hp || '0000000000',
                kelas: siswaData.kelas
            }
        },
        formResponses: responses
    };

    // 10. Save enhanced JSON to orderformresponse
    const OrderFormResponse = require('../../api/v1/orderFormResponses/model');

    await OrderFormResponse.create({
        idOrder: newOrder.idOrder,
        idField: null,
        nilaiJawaban: JSON.stringify(enhancedData)
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

// --- 8. DUPLICATE FORM FOR PRODUCT (duplicateFormForProduct) ---
/**
 * Duplicates a form template and attaches it to a product
 * @param {number} idProduk - Product ID to attach form to
 * @param {number} idFormTemplate - Template form ID to duplicate
 * @param {string} formType - Type of form ('product' or 'daftar_ulang')
 * @returns {object} Duplicated form with fields
 */
const duplicateFormForProduct = async (idProduk, idFormTemplate, formType = 'product') => {
    // 1. Validate product exists
    const product = await Product.findByPk(idProduk);
    if (!product) {
        throw new NotFoundError(`Product dengan ID ${idProduk} tidak ditemukan.`);
    }

    // 2. Validate template form exists
    const templateForm = await Form.findByPk(idFormTemplate, {
        include: [
            {
                model: FormField,
                as: 'fields',
                required: false
            }
        ]
    });

    if (!templateForm) {
        throw new NotFoundError(`Form template dengan ID ${idFormTemplate} tidak ditemukan.`);
    }

    // 3. Create duplicated form
    const duplicatedForm = await Form.create({
        namaForm: `${templateForm.namaForm} - ${product.namaProduk}`,
        descForm: templateForm.descForm,
        statusForm: templateForm.statusForm,
        formType: formType, // 'product' or 'daftar_ulang'
        idProdukLinked: idProduk, // Link to product
        idFormTemplate: idFormTemplate // Reference to template
    });

    // 4. Duplicate form fields
    if (templateForm.fields && templateForm.fields.length > 0) {
        const fieldsData = templateForm.fields.map(field => ({
            idForm: duplicatedForm.idForm,
            labelField: field.labelField,
            placeholderField: field.placeholderField,
            typeField: field.typeField,
            optionsField: field.optionsField,
            isRequiredField: field.isRequiredField,
            validationField: field.validationField,
            defaultValueField: field.defaultValueField,
            orderField: field.orderField,
            isActiveField: field.isActiveField,
            descField: field.descField,
            warningField: field.warningField
        }));

        await FormField.bulkCreate(fieldsData);
    }

    // 5. Update product.idForm
    await product.update({ idForm: duplicatedForm.idForm });

    // 6. Return duplicated form with fields
    const result = await Form.findByPk(duplicatedForm.idForm, {
        include: [
            {
                model: FormField,
                as: 'fields',
                required: false
            },
            {
                model: Product,
                as: 'linkedProduct',
                attributes: ['idProduk', 'namaProduk'],
                required: false
            },
            {
                model: Form,
                as: 'templateForm',
                attributes: ['idForm', 'namaForm'],
                required: false
            }
        ]
    });

    return result;
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
    duplicateFormForProduct, // NEW
};