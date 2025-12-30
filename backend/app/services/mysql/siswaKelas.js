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
        required: false
    },
    {
        model: ParentProduct2,
        as: 'ruangKelas',
        required: false
    }
];

// --- 1. ENROLL SISWA KE KELAS (create) ---
const enrollSiswa = async (req) => {
    const { idSiswa, idParent2 } = req.body;

    // Validasi Input
    if (!idSiswa || !idParent2) {
        throw new BadRequestError('ID Siswa dan ID Kelas wajib diisi.');
    }

    // Validasi Siswa exists
    const siswa = await checkingSiswa(idSiswa);

    // Check if siswa is active
    if (siswa.statusAktif !== 'Aktif') {
        throw new BadRequestError('Siswa tidak aktif. Hanya siswa aktif yang dapat didaftarkan.');
    }

    // Validasi Kelas exists
    const kelas = await checkingKelas(idParent2);

    // VALIDASI JENJANG KELAS - Check if student's jenjangKelas is allowed
    if (kelas.jenjangKelasIzin && kelas.jenjangKelasIzin.length > 0) {
        const siswaJenjang = parseInt(siswa.jenjangKelas);
        const allowedJenjang = kelas.jenjangKelasIzin.map(j => parseInt(j));

        if (!allowedJenjang.includes(siswaJenjang)) {
            throw new BadRequestError(
                `Siswa kelas ${siswaJenjang} tidak diizinkan masuk ke ruang kelas ini. ` +
                `Ruang kelas ini hanya untuk: Kelas ${allowedJenjang.join(', ')}`
            );
        }
    }

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

    // AUTO-STATUS LOGIC based on payment settings
    let statusEnrollment = 'Pending';
    let sudahDaftarUlang = false;

    if (kelas.idOrderDaftarUlang === null) {
        // GRATIS - Auto Aktif
        statusEnrollment = 'Aktif';
        sudahDaftarUlang = true;
    } else {
        // BERBAYAR - Pending sampai bayar
        statusEnrollment = 'Pending';
        sudahDaftarUlang = false;
    }

    // Buat enrollment
    const newEnrollment = await SiswaKelas.create({
        idSiswa,
        idParent2,
        sudahDaftarUlang,
        idOrderDaftarUlang: null, // Will be set when student pays
        tanggalDaftarUlang: sudahDaftarUlang ? new Date() : null,
        statusEnrollment,
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

// --- 7. BULK ENROLL SISWA ---
const bulkEnrollSiswa = async (req) => {
    const { idSiswa, idParent2 } = req.body;

    // Validate input
    if (!idSiswa || !Array.isArray(idSiswa) || idSiswa.length === 0) {
        throw new BadRequestError('idSiswa harus berupa array dan tidak boleh kosong.');
    }

    if (!idParent2) {
        throw new BadRequestError('idParent2 wajib diisi.');
    }

    // Get kelas info
    const kelas = await checkingKelas(idParent2);

    const results = {
        success: [],
        failed: [],
        total: idSiswa.length
    };

    // Process each student
    for (let i = 0; i < idSiswa.length; i++) {
        const currentIdSiswa = idSiswa[i];

        try {
            // Validate siswa
            const siswa = await checkingSiswa(currentIdSiswa);

            // Check if active
            if (siswa.statusAktif !== 'Aktif') {
                throw new Error(`Siswa tidak aktif`);
            }

            // VALIDASI JENJANG KELAS
            if (kelas.jenjangKelasIzin && kelas.jenjangKelasIzin.length > 0) {
                const siswaJenjang = parseInt(siswa.jenjangKelas);
                const allowedJenjang = kelas.jenjangKelasIzin.map(j => parseInt(j));

                if (!allowedJenjang.includes(siswaJenjang)) {
                    throw new Error(
                        `Siswa kelas ${siswaJenjang} tidak diizinkan. ` +
                        `Kelas ini hanya untuk: Kelas ${allowedJenjang.join(', ')}`
                    );
                }
            }

            // Check if already enrolled
            const existing = await SiswaKelas.findOne({
                where: { idSiswa: currentIdSiswa, idParent2 }
            });

            if (existing) {
                throw new Error(`Sudah terdaftar di kelas ini`);
            }

            // Auto-status logic
            let statusEnrollment = 'Pending';
            let sudahDaftarUlang = false;

            if (kelas.idOrderDaftarUlang === null) {
                statusEnrollment = 'Aktif';
                sudahDaftarUlang = true;
            }

            // Create enrollment
            const newEnrollment = await SiswaKelas.create({
                idSiswa: currentIdSiswa,
                idParent2,
                sudahDaftarUlang,
                idOrderDaftarUlang: null,
                tanggalDaftarUlang: sudahDaftarUlang ? new Date() : null,
                statusEnrollment,
                tanggalMasuk: new Date(),
            });

            results.success.push({
                idSiswa: currentIdSiswa,
                namaLengkap: siswa.namaLengkap,
                statusEnrollment,
                id: newEnrollment.idSiswaKelas
            });

        } catch (error) {
            const siswa = await Siswa.findOne({ where: { idSiswa: currentIdSiswa } });
            results.failed.push({
                idSiswa: currentIdSiswa,
                namaLengkap: siswa ? siswa.namaLengkap : 'Unknown',
                error: error.message
            });
        }
    }

    return results;
};

// --- 8. GET AVAILABLE STUDENTS (not enrolled in this class) ---
const getAvailableStudents = async (req) => {
    const { idParent2, search } = req.query;

    if (!idParent2) {
        throw new BadRequestError('idParent2 wajib diisi.');
    }

    // Get ruang kelas info for jenjangKelasIzin
    const kelas = await checkingKelas(idParent2);

    // Get all enrolled student IDs for this class
    const enrolled = await SiswaKelas.findAll({
        where: { idParent2 },
        attributes: ['idSiswa']
    });

    const enrolledIds = enrolled.map(e => e.idSiswa);

    // Build where clause
    const { Op } = require('sequelize');
    const whereClause = {
        statusAktif: 'Aktif',
        idSiswa: { [Op.notIn]: enrolledIds.length > 0 ? enrolledIds : [0] }
    };

    // AUTO-FILTER by jenjangKelasIzin
    if (kelas.jenjangKelasIzin && kelas.jenjangKelasIzin.length > 0) {
        whereClause.jenjangKelas = {
            [Op.in]: kelas.jenjangKelasIzin.map(j => String(j))
        };
    }

    // Search by name or email
    if (search) {
        whereClause[Op.or] = [
            { namaLengkap: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
        ];
    }

    const students = await Siswa.findAll({
        where: whereClause,
        attributes: ['idSiswa', 'namaLengkap', 'email', 'jenjangKelas', 'asalSekolah'],
        order: [['namaLengkap', 'ASC']],
        limit: 100, // Limit for performance - prevent loading thousands of records
    });

    return students;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    enrollSiswa,
    getAllEnrollments,
    getEnrollmentDetail,
    updateEnrollmentStatus,
    deleteEnrollment,
    checkEnrollment,
    bulkEnrollSiswa,
    getAvailableStudents,
};
