const ParentProduct2 = require('../../api/v1/parentProduct2/model');
const ParentProduct1 = require('../../api/v1/parentProduct1/model');
const { NotFoundError, BadRequestError } = require('../../errors');

// Helper untuk validasi ParentProduct1
const checkingParentProduct1 = async (idParent1) => {
    const checkParent1 = await ParentProduct1.findOne({
        where: { idParent1: idParent1 },
    });

    if (!checkParent1) {
        throw new NotFoundError(`ID ParentProduct1: ${idParent1} tidak ditemukan.`);
    }
};

// --- 1. GET ALL PARENT PRODUCT 2 (readAll) ---
const getAllParentProduct2 = async (req) => {
    const result = await ParentProduct2.findAll({
        include: {
            model: ParentProduct1,
            as: 'parentProduct1',  // WAJIB ADA
            attributes: ['idParent1', 'namaParent1'],
        },
        order: [['idParent2', 'DESC']],
    });
    return result;
};

// --- 2. GET ONE PARENT PRODUCT 2 (readOne) ---
const getOneParentProduct2 = async (req) => {
    const { id } = req.params;

    const result = await ParentProduct2.findOne({
        where: { idParent2: id },
        include: {
            model: ParentProduct1,
            as: 'parentProduct1',  // WAJIB ADA
            attributes: ['idParent1', 'namaParent1'],
        },
    });

    if (!result) {
        throw new NotFoundError(`Kategori produk sub-induk dengan ID: ${id} tidak ditemukan.`);
    }

    return result;
};

// --- 3. CREATE PARENT PRODUCT 2 (create) ---
const createParentProduct2 = async (req) => {
    const { idParent1, namaParent2, descParent2, tglPublish, status, tautanProduk } = req.body;

    // 1. Cek keberadaan ParentProduct1
    await checkingParentProduct1(idParent1);

    // 2. Cek duplikasi namaParent2
    const checkName = await ParentProduct2.findOne({ where: { namaParent2 } });
    if (checkName) {
        throw new BadRequestError('Nama kategori produk sub-induk sudah terdaftar.');
    }

    const result = await ParentProduct2.create({
        idParent1,
        namaParent2,
        descParent2,
        tglPublish,
        status,
        tautanProduk,
    });

    return result;
};

// --- 4. UPDATE PARENT PRODUCT 2 (update) - Disesuaikan untuk PATCH ---
const updateParentProduct2 = async (req) => {
    const { id } = req.params;
    const updateFields = req.body;

    // 1. Pengecekan Keberadaan ParentProduct2
    const current = await getOneParentProduct2(req);

    // 2. Jika idParent1 disertakan, cek keberadaannya
    if (updateFields.idParent1) {
        await checkingParentProduct1(updateFields.idParent1);
    }

    // 3. Pengecekan Duplikasi Nama (Hanya jika namaParent2 disertakan)
    if (updateFields.namaParent2) {
        const checkName = await ParentProduct2.findOne({
            where: {
                namaParent2: updateFields.namaParent2,
                idParent2: { [ParentProduct2.sequelize.Op.ne]: id } // Kecuali ID yang sedang diupdate
            },
        });

        if (checkName) {
            throw new BadRequestError('Nama kategori produk sub-induk sudah terdaftar di entitas lain.');
        }
    }

    // 4. Update Database
    await ParentProduct2.update(updateFields, {
        where: { idParent2: id }
    });

    // 5. Dapatkan data yang sudah di-update
    return getOneParentProduct2(req);
};

// --- 5. DELETE PARENT PRODUCT 2 (destroy) ---
const deleteParentProduct2 = async (req) => {
    const { id } = req.params;

    const result = await ParentProduct2.findOne({
        where: { idParent2: id },
    });

    if (!result) {
        throw new NotFoundError(`Kategori produk sub-induk dengan ID: ${id} tidak ditemukan.`);
    }

    // Catatan: Tidak perlu cek children, karena ini adalah sub-kategori terendah dalam hirarki ini.

    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI DENGAN NAMA YANG SAMA DENGAN DEFINISI DI ATAS
module.exports = {
    getAllParentProduct2,
    getOneParentProduct2,
    createParentProduct2,
    updateParentProduct2,
    deleteParentProduct2,
};