const SiswaKelas = require('../../api/v1/siswaKelas/model');
const Siswa = require('../../api/v1/siswa/model');
const ParentProduct2 = require('../../api/v1/parentProduct2/model');
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

// Helper untuk validasi Kelas (ParentProduct2)
const checkingKelas = async (idParent2) => {
    const checkKelas = await ParentProduct2.findOne({ where: { idParent2 } });
    if (!checkKelas) {
        throw new NotFoundError(`ID Kelas: ${idParent2} tidak ditemukan.`);
    }
    return checkKelas;
};

// Include configuration
const siswaKelasIncludes = [
    {
        model: Siswa,
        as: 'siswa',
        attributes: ['idSiswa', 'namaLengkap', 'noHp', 'email'],
    },
    {
        model: ParentProduct2,
        as: 'ruangKelas',
        attributes: ['idParent2', 'namaParent2', 'tahunAjaran', 'kapasitasMaksimal'],
    },
    {
        model: Order,
        as: 'orderDaftarUlang',
        attributes: ['idOrder', 'hargaFinal', 'statusPembayaran'],
        required: false,
    }
];

// --- 1. ENROLL SISWA KE KELAS (create) ---
const enrollSiswa = async (req) => {
    const { idSiswa, idParent2, sudahDaftarUlang, idOrderDaftarUlang } = req.body;

    // Validasi Input
    if (!idSiswa || !idParent2) {
        throw new BadRequestError('ID Siswa dan ID Kelas wajib diisi.');
    }

    // Validasi Siswa exists
    await checkingSiswa(idSiswa);

    // Validasi Kelas exists
    const kelas = await checkingKelas(idParent2);

    // Cek apakah sudah enrolled
    const existing = await SiswaKelas.findOne({
        where: { idSiswa, idParent2 }
    });

    if (existing) {
        throw new BadRequestError('Siswa sudah terdaftar di kelas ini.');
    }

    // Cek kapasitas kelas
    if (kelas.kapasitasMaksimal) {
        const currentCount = await SiswaKelas.count({
            where: { idParent2, statusEnrollment: 'Aktif' }
        });

        if (currentCount >= kelas.kapasitasMaksimal) {
            throw new BadRequestError('Kapasitas kelas sudah penuh.');
        }
    }

    // Buat enrollment
    const newEnrollment = await SiswaKelas.create({
        idSiswa,
        idParent2,
        sudahDaftarUlang: sudahDaftarUlang || false,
        idOrderDaftarUlang,
        tanggalDaftarUlang: sudahDaftarUlang ? new Date() : null,
        statusEnrollment: 'Pending',
        tanggalMasuk: new Date(),
    });

    // Ambil data lengkap
    const result = await SiswaKelas.findOne({
        where: { idSiswaKelas: newEnrollment.idSiswaKelas },
        include: siswaKelasIncludes,
    });

    return result;
};

// --- 2. GET ALL ENROLLMENTS (readAll) ---
const getAllEnrollments = async (req) => {
    const { idParent2, idSiswa, statusEnrollment } = req.query;

    let whereClause = {};

    if (idParent2) {
        whereClause.idParent2 = idParent2;
    }

    if (idSiswa) {
        whereClause.idSiswa = idSiswa;
    }

    if (statusEnrollment) {
        whereClause.statusEnrollment = statusEnrollment;
    }

    const result = await SiswaKelas.findAll({
        where: whereClause,
        include: siswaKelasIncludes,
        order: [['tanggalMasuk', 'DESC']],
    });

    return result;
};

// --- 3. GET ENROLLMENT DETAIL (readOne) ---
const getEnrollmentDetail = async (idSiswaKelas) => {
    const result = await SiswaKelas.findOne({
        where: { idSiswaKelas },
        include: siswaKelasIncludes,
    });

    if (!result) {
        throw new NotFoundError(`Enrollment dengan ID: ${idSiswaKelas} tidak ditemukan.`);
    }

    return result;
};

// --- 4. UPDATE ENROLLMENT STATUS (update) ---
const updateEnrollmentStatus = async (idSiswaKelas, data) => {
    const { statusEnrollment, sudahDaftarUlang, idOrderDaftarUlang } = data;

    // Cek keberadaan Enrollment
    const checkEnrollment = await SiswaKelas.findOne({ where: { idSiswaKelas } });
    if (!checkEnrollment) {
        throw new NotFoundError(`Enrollment dengan ID: ${idSiswaKelas} tidak ditemukan.`);
    }

    // Validasi status
    const validStatuses = ['Pending', 'Aktif', 'Lulus', 'Dropout'];
    if (statusEnrollment && !validStatuses.includes(statusEnrollment)) {
        throw new BadRequestError(`Status tidak valid. Pilihan: ${validStatuses.join(', ')}`);
    }

    // Update data
    const updateData = {};
    if (statusEnrollment) updateData.statusEnrollment = statusEnrollment;
    if (sudahDaftarUlang !== undefined) {
        updateData.sudahDaftarUlang = sudahDaftarUlang;
        if (sudahDaftarUlang && !checkEnrollment.tanggalDaftarUlang) {
            updateData.tanggalDaftarUlang = new Date();
        }
    }
    if (idOrderDaftarUlang) updateData.idOrderDaftarUlang = idOrderDaftarUlang;

    await checkEnrollment.update(updateData);

    // Dapatkan data yang sudah di-update
    const updatedEnrollment = await getEnrollmentDetail(idSiswaKelas);
    return updatedEnrollment;
};

// --- 5. DELETE ENROLLMENT (destroy) ---
const deleteEnrollment = async (idSiswaKelas) => {
    const result = await SiswaKelas.findOne({
        where: { idSiswaKelas },
    });

    if (!result) {
        throw new NotFoundError(`Enrollment dengan ID: ${idSiswaKelas} tidak ditemukan.`);
    }

    // Hapus enrollment
    await result.destroy();

    return result;
};

// --- 6. CHECK ENROLLMENT (helper) ---
const checkEnrollment = async (idSiswa, idParent2) => {
    const enrollment = await SiswaKelas.findOne({
        where: { idSiswa, idParent2 }
    });

    return enrollment;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    enrollSiswa,
    getAllEnrollments,
    getEnrollmentDetail,
    updateEnrollmentStatus,
    deleteEnrollment,
    checkEnrollment,
};
