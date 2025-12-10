const OrangTua = require('../../api/v1/orangTua/model');
const Siswa = require('../../api/v1/siswa/model');
const { NotFoundError, BadRequestError } = require('../../errors');

// Helper untuk validasi Siswa
const checkingSiswa = async (idSiswa) => {
    const checkSiswa = await Siswa.findOne({
        where: { idSiswa },
    });

    if (!checkSiswa) {
        throw new NotFoundError(`ID Siswa: ${idSiswa} tidak ditemukan.`);
    }
    return checkSiswa;
};

// --- 1. CREATE ORANG TUA (create) ---
const createOrangTua = async (req) => {
    const {
        idSiswa,
        namaAyah, pekerjaanAyah, noHpAyah,
        namaIbu, pekerjaanIbu, noHpIbu,
        namaWali, hubunganWali, noHpWali
    } = req.body;

    // Validasi Input
    if (!idSiswa) {
        throw new BadRequestError('ID Siswa wajib diisi.');
    }

    // Validasi Siswa exists
    await checkingSiswa(idSiswa);

    // Cek apakah sudah ada data orang tua untuk siswa ini
    const existing = await OrangTua.findOne({ where: { idSiswa } });
    if (existing) {
        throw new BadRequestError('Data orang tua untuk siswa ini sudah ada. Gunakan update.');
    }

    // Buat OrangTua
    const newOrangTua = await OrangTua.create({
        idSiswa,
        namaAyah,
        pekerjaanAyah,
        noHpAyah,
        namaIbu,
        pekerjaanIbu,
        noHpIbu,
        namaWali,
        hubunganWali,
        noHpWali,
    });

    // Ambil data lengkap dengan relasi
    const result = await OrangTua.findOne({
        where: { idOrangTua: newOrangTua.idOrangTua },
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'noHp'],
            }
        ],
    });

    return result;
};

// --- 2. GET ORANG TUA BY SISWA (readBySiswa) ---
const getOrangTuaBySiswa = async (idSiswa) => {
    // Validasi Siswa exists
    await checkingSiswa(idSiswa);

    const result = await OrangTua.findOne({
        where: { idSiswa },
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'noHp', 'email'],
            }
        ],
    });

    if (!result) {
        throw new NotFoundError(`Data orang tua untuk siswa ID: ${idSiswa} tidak ditemukan.`);
    }

    return result;
};

// --- 3. UPDATE ORANG TUA (update) ---
const updateOrangTua = async (idOrangTua, data) => {
    // Cek keberadaan OrangTua
    const checkOrangTua = await OrangTua.findOne({ where: { idOrangTua } });
    if (!checkOrangTua) {
        throw new NotFoundError(`Data orang tua dengan ID: ${idOrangTua} tidak ditemukan.`);
    }

    // Update OrangTua
    await checkOrangTua.update(data);

    // Dapatkan data yang sudah di-update
    const updatedOrangTua = await OrangTua.findOne({
        where: { idOrangTua },
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap'],
            }
        ],
    });

    return updatedOrangTua;
};

// --- 4. DELETE ORANG TUA (destroy) ---
const deleteOrangTua = async (idOrangTua) => {
    const result = await OrangTua.findOne({
        where: { idOrangTua },
    });

    if (!result) {
        throw new NotFoundError(`Data orang tua dengan ID: ${idOrangTua} tidak ditemukan.`);
    }

    // Hapus orang tua
    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    createOrangTua,
    getOrangTuaBySiswa,
    updateOrangTua,
    deleteOrangTua,
};
