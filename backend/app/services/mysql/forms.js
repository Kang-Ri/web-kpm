const { NotFoundError, BadRequestError } = require('../../errors'); // Asumsi path error benar
const { Op } = require('sequelize');

// Sesuaikan path import model agar sesuai dengan struktur umum:
const Form = require('../../api/v1/forms/model');
const Product = require('../../api/v1/product/model');
const SiswaKelas = require('../../api/v1/siswaKelas/model');
const ParentProduct2 = require('../../api/v1/parentProduct2/model');

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
        formfield: req.body.formfield || null, // JSON structure
    });

    return newForm;
};

// --- 2. GET ALL FORMS (readAll) ---
const getAllForms = async (req) => {
    // Support filtering by formType (e.g., 'template', 'product', 'daftar_ulang')
    const { formType } = req?.query || {};

    let whereClause = {};
    if (formType) {
        whereClause.formType = formType;
    }

    // Hanya mengambil data Form. Kita tidak perlu menyebutkan atribut jika ingin mengambil semua:
    const result = await Form.findAll({
        where: whereClause,
        attributes: ['idForm', 'namaForm', 'descForm', 'statusForm', 'formType', 'tglDibuat', 'formfield'],
        include: [
            productInclude
        ],
        order: [['idForm', 'DESC']],
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
            productInclude
        ],
    });

    if (!result) {
        throw new NotFoundError(`Form dengan ID: ${idForm} tidak ditemukan.`);
    }

    return result;
};

// --- 4. UPDATE STATUS FORM (update) ---
// Controller akan meneruskan idForm dan data update (bukan req)
const updateForm = async (idForm, data) => {
    const { namaForm, descForm, statusForm, formfield } = data;

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

    await checkForm.update({
        namaForm: namaForm !== undefined ? namaForm : checkForm.namaForm,
        descForm: descForm !== undefined ? descForm : checkForm.descForm,
        statusForm: statusForm !== undefined ? statusForm : checkForm.statusForm,
        formfield: formfield !== undefined ? formfield : checkForm.formfield,
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
    });

    if (!form) {
        throw new NotFoundError(`Form dengan ID ${idForm} tidak ditemukan.`);
    }

    if (form.statusForm !== 'Aktif') {
        throw new BadRequestError('Form sudah tidak aktif.');
    }

    // 2. Validasi semua required fields terisi
    const fieldsArray = form.formfield || [];
    const requiredFields = fieldsArray.filter(f => f.required === true);
    for (const field of requiredFields) {
        if (!responses[field.namaLabel] || responses[field.namaLabel] === '') {
            throw new BadRequestError(`Field "${field.namaLabel}" wajib diisi.`);
        }
    }

    // 3. Validasi format email
    for (const field of fieldsArray) {
        if (field.jenisField === 'email' && responses[field.namaLabel]) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(responses[field.namaLabel])) {
                throw new BadRequestError(`Format email pada field "${field.namaLabel}" tidak valid.`);
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
                attributes: ['idParent2', 'namaParent2', 'kategoriHargaDaftarUlang', 'hargaDaftarUlang'],
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
        const category = siswaKelas.parentProduct2?.kategoriHargaDaftarUlang;
        const basePrice = parseFloat(siswaKelas.parentProduct2?.hargaDaftarUlang) || 0;

        if (siswaKelas.parentProduct2?.products && siswaKelas.parentProduct2.products.length > 0) {
            daftarUlangProduct = siswaKelas.parentProduct2.products[0];
            hargaDaftarUlang = daftarUlangProduct.hargaJual || 0;
            namaKelas = daftarUlangProduct.namaProduk;
        } else {
            // Fallback: no Product found, use ParentProduct2 data
            hargaDaftarUlang = basePrice;
            namaKelas = `Daftar Ulang - ${siswaKelas.parentProduct2?.namaParent2 || form.namaForm}`;
            
            // Critical fix: mock a product-like object for category check below
            daftarUlangProduct = { kategoriHarga: category };
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
        statusPembayaran: (hargaDaftarUlang > 0 || (daftarUlangProduct && daftarUlangProduct.kategoriHarga === 'Seikhlasnya')) ? 'Unpaid' : 'Paid',
        paymentMethod: null,
        tglOrder: new Date()
    });

    // 6. Link Order to SiswaKelas and Activate if Free
    if (idSiswaKelas) {
        const SiswaKelas = require('../../api/v1/siswaKelas/model');
        const updatePayload = { idOrderDaftarUlang: newOrder.idOrder };
        
        // If free (status Paid), activate immediately
        if (newOrder.statusPembayaran === 'Paid') {
            updatePayload.statusEnrollment = 'Aktif';
            updatePayload.tanggalMasuk = new Date();
        }
        
        await SiswaKelas.update(updatePayload, { where: { idSiswaKelas } });
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
        needsPayment: hargaDaftarUlang > 0 || (daftarUlangProduct && daftarUlangProduct.kategoriHarga === 'Seikhlasnya'),
        formData: responses
    };
};

const duplicateForm = async (idForm, newName = null) => {
    const originalForm = await Form.findOne({
        where: { idForm },
    });

    if (!originalForm) throw new NotFoundError(`Form dengan ID ${idForm} tidak ditemukan.`);

    const duplicatedForm = await Form.create({
        namaForm: newName || `${originalForm.namaForm} (Copy)`,
        descForm: originalForm.descForm,
        statusForm: 'Draft',
        formfield: originalForm.formfield,
    });

    return duplicatedForm;
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

    const duplicatedForm = await Form.create({
        namaForm: `${templateForm.namaForm} - ${product.namaProduk}`,
        descForm: templateForm.descForm,
        statusForm: templateForm.statusForm,
        formType: formType, // 'product' or 'daftar_ulang'
        idProdukLinked: idProduk, // Link to product
        idFormTemplate: idFormTemplate, // Reference to template
        formfield: templateForm.formfield, // Duplicate JSON field
    });

    // 5. Update product.idForm
    await product.update({ idForm: duplicatedForm.idForm });

    // 6. Return duplicated form with fields
    const result = await Form.findByPk(duplicatedForm.idForm, {
        include: [
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