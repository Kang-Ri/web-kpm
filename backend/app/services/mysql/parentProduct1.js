const ParentProduct1 = require('../../api/v1/parentProduct1/model'); // <-- Import Model Sequelize
const { NotFoundError, BadRequestError } = require('../../errors');
const { Op } = require('sequelize'); // Diperlukan untuk query yang kompleks

// --- Fungsi Pengecekan Duplikasi ---
const checkingParentProduct1 = async (namaParent1, id) => {
    let condition = {
        namaParent1,
    };

    // Jika id diberikan (untuk operasi UPDATE), tambahkan kondisi pengecualian
    if (id) {
        condition.idParent1 = { [Op.ne]: id }; // Op.ne = Not Equal
    }

    const check = await ParentProduct1.findOne({
        where: condition,
    });

    if (check) {
        throw new BadRequestError(`Nama Parent Product 1: ${namaParent1} sudah ada.`);
    }
};

// --- CREATE ---
const createParentProduct1 = async (req) => {
    const { namaParent1, descParent1, tglPublish, status, tautanProduk } = req.body;

    // 1. Pengecekan Duplikasi
    await checkingParentProduct1(namaParent1);

    // 2. Insert ke Database menggunakan Sequelize .create()
    const result = await ParentProduct1.create({
        namaParent1,
        descParent1,
        tglPublish,
        status,
        tautanProduk
    });

    return result; // Sequelize .create() mengembalikan instance yang baru dibuat
};

// --- READ ALL ---
const getAllParentProduct1 = async (req) => {
    // Implementasi filtering/searching (opsional: dari query params req.query)
    // Untuk saat ini, ambil semua data
    const result = await ParentProduct1.findAll({
        order: [['idParent1', 'DESC']] // Mengganti ORDER BY SQL
    });
    
    return result;
};

// --- READ ONE ---
const getOneParentProduct1 = async (req) => {
    const { id } = req.params;

    const result = await ParentProduct1.findByPk(id); // Mengganti SELECT * WHERE id = ?

    if (!result) {
        throw new NotFoundError(`Parent Product 1 dengan ID: ${id} tidak ditemukan.`);
    }

    return result;
};

// --- UPDATE ---
const updateParentProduct1 = async (req) => {
    const { id } = req.params;
    const updateFields = req.body;
    
    // 1. Pengecekan Keberadaan
    // Menggunakan fungsi getOneParentProduct1 (yang akan melempar error jika tidak ditemukan)
    const current = await getOneParentProduct1(req); 

    // 2. Pengecekan Duplikasi Nama (Hanya jika namaParent1 disertakan dalam request body)
    if (updateFields.namaParent1) {
        const checkName = await ParentProduct1.findOne({
            where: { 
                namaParent1: updateFields.namaParent1, 
                idParent1: { [ParentProduct1.sequelize.Op.ne]: id } // Kecuali ID yang sedang diupdate
            },
        });

        if (checkName) {
            throw new BadRequestError('Nama kategori produk induk sudah terdaftar di entitas lain.');
        }
    }
    
    // 3. Update Database menggunakan .update()
    // Karena kita menggunakan .update(), Sequelize akan otomatis hanya mengambil field 
    // yang didefinisikan di Model dari objek 'updateFields' (req.body)
    await ParentProduct1.update(updateFields, {
        where: { idParent1: id }
    });

    // 4. Dapatkan data yang sudah di-update
    return getOneParentProduct1(req); 
};

// --- DELETE ---
const deleteParentProduct1 = async (req) => {
    const { id } = req.params;

    // 1. Pengecekan Keberadaan
    const result = await getOneParentProduct1(req); // Akan throw error jika tidak ada

    // 2. Hapus dari Database menggunakan .destroy()
    await result.destroy(); 
    
    // Atau: await ParentProduct1.destroy({ where: { idParent1: id } });
    
    return result;
};


module.exports = {
    getAllParentProduct1,
    getOneParentProduct1,
    createParentProduct1,
    updateParentProduct1,
    deleteParentProduct1,
    checkingParentProduct1,
};