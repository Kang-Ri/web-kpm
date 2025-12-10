const AksesMateri = require('../../api/v1/aksesMateri/model');
const Siswa = require('../../api/v1/siswa/model');
const Product = require('../../api/v1/product/model');
const Order = require('../../api/v1/order/model');
const { NotFoundError, BadRequestError } = require('../../errors');

// Helper untuk validasi Siswa
const checkingSiswa = async (idSiswa) => {
    const checkSiswa = await Siswa.findOne({ where: { idSiswa } });
    if (!checkSiswa) {
        throw new NotFoundError(`ID Siswa: ${idSiswa} tidak ditemukan.`);
    }
    return checkSiswa;
};

// Helper untuk validasi Materi
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
const aksesMateriIncludes = [
    {
        model: Siswa,
        as: 'siswa',
        attributes: ['idSiswa', 'namaLengkap', 'noHp', 'email'],
    },
    {
        model: Product,
        as: 'materi',
        attributes: ['idProduk', 'namaProduk', 'hargaJual', 'kategoriHarga'],
    },
    {
        model: Order,
        as: 'order',
        attributes: ['idOrder', 'hargaFinal', 'statusPembayaran'],
        required: false,
    }
];

// --- 1. GRANT ACCESS (create/unlock) ---
const grantAccess = async (req) => {
    const { idSiswa, idProduk, idOrder } = req.body;

    // Validasi Input
    if (!idSiswa || !idProduk) {
        throw new BadRequestError('ID Siswa dan ID Produk wajib diisi.');
    }

    // Validasi Siswa exists
    await checkingSiswa(idSiswa);

    // Validasi Materi exists
    await checkingMateri(idProduk);

    // Cek apakah sudah ada akses
    const existing = await AksesMateri.findOne({
        where: { idSiswa, idProduk }
    });

    if (existing) {
        // Update status jadi Unlocked
        await existing.update({
            statusAkses: 'Unlocked',
            tanggalAkses: new Date(),
            idOrder: idOrder || existing.idOrder,
        });

        return await AksesMateri.findOne({
            where: { idAkses: existing.idAkses },
            include: aksesMateriIncludes,
        });
    }

    // Buat akses baru
    const newAkses = await AksesMateri.create({
        idSiswa,
        idProduk,
        idOrder,
        statusAkses: 'Unlocked',
        tanggalAkses: new Date(),
    });

    // Ambil data lengkap
    const result = await AksesMateri.findOne({
        where: { idAkses: newAkses.idAkses },
        include: aksesMateriIncludes,
    });

    return result;
};

// --- 2. CHECK ACCESS (helper) ---
const checkAccess = async (idSiswa, idProduk) => {
    const akses = await AksesMateri.findOne({
        where: { idSiswa, idProduk }
    });

    return akses;
};

// --- 3. GET ALL ACCESS (readAll) ---
const getAllAccess = async (req) => {
    const { idSiswa, idProduk, statusAkses } = req.query;

    let whereClause = {};

    if (idSiswa) {
        whereClause.idSiswa = idSiswa;
    }

    if (idProduk) {
        whereClause.idProduk = idProduk;
    }

    if (statusAkses) {
        whereClause.statusAkses = statusAkses;
    }

    const result = await AksesMateri.findAll({
        where: whereClause,
        include: aksesMateriIncludes,
        order: [['tanggalAkses', 'DESC']],
    });

    return result;
};

// --- 4. GET ACCESS DETAIL (readOne) ---
const getAccessDetail = async (idAkses) => {
    const result = await AksesMateri.findOne({
        where: { idAkses },
        include: aksesMateriIncludes,
    });

    if (!result) {
        throw new NotFoundError(`Akses dengan ID: ${idAkses} tidak ditemukan.`);
    }

    return result;
};

// --- 5. REVOKE ACCESS (lock) ---
const revokeAccess = async (idAkses) => {
    const akses = await AksesMateri.findOne({ where: { idAkses } });

    if (!akses) {
        throw new NotFoundError(`Akses dengan ID: ${idAkses} tidak ditemukan.`);
    }

    await akses.update({
        statusAkses: 'Locked',
    });

    return await getAccessDetail(idAkses);
};

// --- 6. DELETE ACCESS (destroy) ---
const deleteAccess = async (idAkses) => {
    const result = await AksesMateri.findOne({
        where: { idAkses },
    });

    if (!result) {
        throw new NotFoundError(`Akses dengan ID: ${idAkses} tidak ditemukan.`);
    }

    // Hapus akses
    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    grantAccess,
    checkAccess,
    getAllAccess,
    getAccessDetail,
    revokeAccess,
    deleteAccess,
};
