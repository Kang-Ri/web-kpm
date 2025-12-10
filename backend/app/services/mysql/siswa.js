const Siswa = require('../../api/v1/siswa/model');
const Users = require('../../api/v1/users/model');
const { NotFoundError, BadRequestError } = require('../../errors');

// Helper untuk validasi User
const checkingUser = async (idUser) => {
    const checkUser = await Users.findOne({
        where: { idUser },
    });

    if (!checkUser) {
        throw new NotFoundError(`ID User: ${idUser} tidak ditemukan.`);
    }
    return checkUser;
};

// Include configuration untuk relasi
const siswaIncludes = [
    {
        model: Users,
        as: 'user',
        attributes: ['idUser', 'email', 'namaLengkap'],
        required: false,
    },
];

// --- 1. CREATE SISWA (create) ---
const createSiswa = async (req) => {
    const {
        idUser, namaLengkap, tempatLahir, tanggalLahir, jenisKelamin, agama,
        nik, nisn, alamatLengkap, kota, provinsi, kodePos,
        noHp, email, statusAktif
    } = req.body;

    // Validasi Input
    if (!namaLengkap) {
        throw new BadRequestError('Nama lengkap wajib diisi.');
    }

    // Jika ada idUser, validasi
    if (idUser) {
        await checkingUser(idUser);
    }

    // Buat Siswa
    const newSiswa = await Siswa.create({
        idUser,
        namaLengkap,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        agama,
        nik,
        nisn,
        alamatLengkap,
        kota,
        provinsi,
        kodePos,
        noHp,
        email,
        statusAktif: statusAktif || 'Aktif',
    });

    // Ambil data lengkap dengan relasi
    const result = await Siswa.findOne({
        where: { idSiswa: newSiswa.idSiswa },
        include: siswaIncludes,
    });

    return result;
};

// --- 2. GET ALL SISWA (readAll) ---
const getAllSiswa = async (req) => {
    const { statusAktif, kota, provinsi } = req.query;

    let whereClause = {};

    if (statusAktif) {
        whereClause.statusAktif = statusAktif;
    }

    if (kota) {
        whereClause.kota = kota;
    }

    if (provinsi) {
        whereClause.provinsi = provinsi;
    }

    const result = await Siswa.findAll({
        where: whereClause,
        include: siswaIncludes,
        order: [['namaLengkap', 'ASC']],
    });

    return result;
};

// --- 3. GET ONE SISWA (readOne) ---
const getSiswaDetail = async (idSiswa) => {
    const result = await Siswa.findOne({
        where: { idSiswa },
        include: [
            ...siswaIncludes,
            {
                model: require('../../api/v1/orangTua/model'),
                as: 'orangTua',
            }
        ],
    });

    if (!result) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    return result;
};

// --- 4. UPDATE SISWA (update) ---
const updateSiswa = async (idSiswa, data) => {
    // Cek keberadaan Siswa
    const checkSiswa = await Siswa.findOne({ where: { idSiswa } });
    if (!checkSiswa) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    // Update Siswa
    await checkSiswa.update(data);

    // Dapatkan data yang sudah di-update
    const updatedSiswa = await getSiswaDetail(idSiswa);
    return updatedSiswa;
};

// --- 5. DELETE SISWA (destroy) ---
const deleteSiswa = async (idSiswa) => {
    const result = await Siswa.findOne({
        where: { idSiswa },
    });

    if (!result) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    // Hapus siswa (cascade akan menghapus orangTua, siswaKelas, aksesMateri terkait)
    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    createSiswa,
    getAllSiswa,
    getSiswaDetail,
    updateSiswa,
    deleteSiswa,
};
