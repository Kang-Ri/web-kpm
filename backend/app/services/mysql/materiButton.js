const MateriButton = require('../../api/v1/materiButton/model');
const Product = require('../../api/v1/product/model');
const { NotFoundError, BadRequestError } = require('../../errors');
const { Op } = require('sequelize');

// Helper untuk validasi Product (Materi)
const checkingMateri = async (idProduk) => {
    const checkMateri = await Product.findOne({
        where: { idProduk, jenisProduk: 'Materi' }
    });

    if (!checkMateri) {
        throw new NotFoundError(`ID Materi: ${idProduk} tidak ditemukan atau bukan jenis Materi.`);
    }
    return checkMateri;
};

// Include configuration
const materiButtonIncludes = [
    {
        model: Product,
        as: 'materi',
        attributes: ['idProduk', 'namaProduk', 'jenisProduk'],
    }
];

// --- 1. CREATE BUTTON (create) ---
const createButton = async (req) => {
    const {
        idProduk, namaButton, linkTujuan, deskripsiButton,
        tanggalPublish, tanggalExpire, statusButton, orderIndex
    } = req.body;

    // Validasi Input
    if (!idProduk || !namaButton || !linkTujuan) {
        throw new BadRequestError('ID Produk, Nama Button, dan Link Tujuan wajib diisi.');
    }

    // Validasi Materi exists
    await checkingMateri(idProduk);

    // Buat Button
    const newButton = await MateriButton.create({
        idProduk,
        namaButton,
        linkTujuan,
        deskripsiButton,
        tanggalPublish,
        tanggalExpire,
        statusButton: statusButton || 'Active',
        orderIndex: orderIndex || 0,
    });

    // Ambil data lengkap
    const result = await MateriButton.findOne({
        where: { idButton: newButton.idButton },
        include: materiButtonIncludes,
    });

    return result;
};

// --- 2. GET ALL BUTTONS (readAll) ---
const getAllButtons = async (req) => {
    const { idProduk, statusButton } = req.query;

    let whereClause = {};

    if (idProduk) {
        whereClause.idProduk = idProduk;
    }

    if (statusButton) {
        whereClause.statusButton = statusButton;
    }

    const result = await MateriButton.findAll({
        where: whereClause,
        include: materiButtonIncludes,
        order: [['orderIndex', 'ASC']],
    });

    return result;
};

// --- 3. GET ACTIVE BUTTONS (untuk siswa) ---
const getActiveButtons = async (idProduk) => {
    // Validasi Materi exists
    await checkingMateri(idProduk);

    const now = new Date();

    const result = await MateriButton.findAll({
        where: {
            idProduk,
            statusButton: 'Active',
            [Op.or]: [
                { tanggalPublish: null },
                { tanggalPublish: { [Op.lte]: now } }
            ],
            [Op.or]: [
                { tanggalExpire: null },
                { tanggalExpire: { [Op.gt]: now } }
            ]
        },
        include: materiButtonIncludes,
        order: [['orderIndex', 'ASC']],
    });

    return result;
};

// --- 4. GET BUTTON DETAIL (readOne) ---
const getButtonDetail = async (idButton) => {
    const result = await MateriButton.findOne({
        where: { idButton },
        include: materiButtonIncludes,
    });

    if (!result) {
        throw new NotFoundError(`Button dengan ID: ${idButton} tidak ditemukan.`);
    }

    return result;
};

// --- 5. UPDATE BUTTON (update) ---
const updateButton = async (idButton, data) => {
    // Cek keberadaan Button
    const checkButton = await MateriButton.findOne({ where: { idButton } });
    if (!checkButton) {
        throw new NotFoundError(`Button dengan ID: ${idButton} tidak ditemukan.`);
    }

    // Update Button
    await checkButton.update(data);

    // Dapatkan data yang sudah di-update
    const updatedButton = await getButtonDetail(idButton);
    return updatedButton;
};

// --- 6. DELETE BUTTON (destroy) ---
const deleteButton = async (idButton) => {
    const result = await MateriButton.findOne({
        where: { idButton },
    });

    if (!result) {
        throw new NotFoundError(`Button dengan ID: ${idButton} tidak ditemukan.`);
    }

    // Hapus button
    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    createButton,
    getAllButtons,
    getActiveButtons,
    getButtonDetail,
    updateButton,
    deleteButton,
};
