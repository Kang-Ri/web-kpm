const Siswa = require('../../api/v1/siswa/model');
const Users = require('../../api/v1/users/model');
const { NotFoundError, BadRequestError } = require('../../errors');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

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
        attributes: ['idUser', 'email', 'namaLengkap', 'noHp'],
        required: false,
    },
];

// --- 1. CREATE SISWA (create) dengan AUTO-CREATE USER ---
const createSiswa = async (req) => {
    const {
        namaLengkap, tempatLahir, tanggalLahir, jenisKelamin, jenjangKelas, asalSekolah, agama,
        nik, nisn, alamatLengkap, kota, provinsi, kodePos,
        noHp, email, statusAktif
    } = req.body;

    // Validasi Input Wajib
    if (!namaLengkap) {
        throw new BadRequestError('Nama lengkap wajib diisi.');
    }

    // Validasi: Email ATAU NISN harus ada (untuk create user account)
    if (!email && !nisn) {
        throw new BadRequestError('Email atau NISN wajib diisi untuk membuat akun siswa.');
    }

    // 1. CREATE USER ACCOUNT OTOMATIS
    try {
        // Generate username dari email atau NISN
        const username = email || `${nisn}@student.webkpm.com`;

        // Generate password default (menggunakan NISN atau 6 digit pertama email)
        const defaultPassword = nisn || email.split('@')[0];
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create User dengan role Siswa (idRole = 5)
        const newUser = await Users.create({
            namaLengkap,
            email: username,
            password: hashedPassword,
            noHp: noHp || null,
            idRole: 5, // Role Siswa
        });

        // 2. CREATE SISWA dengan idUser dari user yang baru dibuat
        const newSiswa = await Siswa.create({
            idUser: newUser.idUser,
            namaLengkap,
            tempatLahir,
            tanggalLahir,
            jenisKelamin,
            jenjangKelas,
            asalSekolah,
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

        // 3. Ambil data lengkap dengan relasi User
        const result = await Siswa.findOne({
            where: { idSiswa: newSiswa.idSiswa },
            include: siswaIncludes,
        });

        return result;

    } catch (error) {
        // Handle duplicate email/username error
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.fields.email) {
                throw new BadRequestError(`Email ${email || nisn} sudah terdaftar.`);
            }
        }
        throw error;
    }
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

// --- 6. BULK IMPORT SISWA FROM EXCEL ---
const bulkImportSiswa = async (file) => {
    if (!file) {
        throw new BadRequestError('File Excel tidak ditemukan.');
    }

    try {
        // Parse Excel file
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            throw new BadRequestError('File Excel kosong atau format tidak valid.');
        }

        const results = {
            success: [],
            failed: [],
            total: data.length
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 karena row 1 adalah header, dan index dimulai dari 0

            try {
                // Validasi required fields
                if (!row.namaLengkap || !row.email) {
                    throw new Error('Kolom namaLengkap dan email wajib diisi.');
                }

                // Validasi email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.email)) {
                    throw new Error('Format email tidak valid.');
                }

                // Check if email already exists
                const existingUser = await Users.findOne({ where: { email: row.email } });
                if (existingUser) {
                    throw new Error(`Email ${row.email} sudah terdaftar.`);
                }

                // Hash password default "KPMUser"
                const hashedPassword = await bcrypt.hash('KPMUser', 10);

                // Create User account
                const newUser = await Users.create({
                    namaLengkap: row.namaLengkap,
                    email: row.email,
                    password: hashedPassword,
                    noHp: null,
                    idRole: 5, // Role Siswa
                });

                // Create Siswa record
                const newSiswa = await Siswa.create({
                    idUser: newUser.idUser,
                    namaLengkap: row.namaLengkap,
                    jenjangKelas: row.jenjangKelas || null,
                    asalSekolah: row.asalSekolah || null,
                    email: row.email,
                    statusAktif: 'Aktif',
                });

                results.success.push({
                    row: rowNumber,
                    namaLengkap: row.namaLengkap,
                    email: row.email,
                });

            } catch (error) {
                results.failed.push({
                    row: rowNumber,
                    namaLengkap: row.namaLengkap || '-',
                    email: row.email || '-',
                    error: error.message,
                });
            }
        }

        return results;

    } catch (error) {
        throw new BadRequestError(`Gagal memproses file Excel: ${error.message}`);
    }
};

// --- 7. BULK DELETE SISWA ---
const bulkDeleteSiswa = async (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('Array ID siswa tidak valid.');
    }

    const results = {
        success: [],
        failed: [],
        total: ids.length
    };

    for (const id of ids) {
        try {
            const siswa = await Siswa.findOne({ where: { idSiswa: id } });

            if (!siswa) {
                results.failed.push({
                    idSiswa: id,
                    error: 'Siswa tidak ditemukan'
                });
                continue;
            }

            await siswa.destroy();

            results.success.push({
                idSiswa: id,
                namaLengkap: siswa.namaLengkap
            });

        } catch (error) {
            results.failed.push({
                idSiswa: id,
                error: error.message
            });
        }
    }

    return results;
};

// --- 8. EXPORT SISWA DATA TO EXCEL ---
const exportSiswaData = async (filters = {}) => {
    // Get all siswa data with filters if any
    const whereClause = {};

    if (filters.statusAktif) {
        whereClause.statusAktif = filters.statusAktif;
    }

    const siswaList = await Siswa.findAll({
        where: whereClause,
        include: siswaIncludes,
        order: [['namaLengkap', 'ASC']],
    });

    // Transform data for Excel
    const excelData = siswaList.map(siswa => ({
        'ID Siswa': siswa.idSiswa,
        'Nama Lengkap': siswa.namaLengkap,
        'Email': siswa.email || '-',
        'NISN': siswa.nisn || '-',
        'No HP': siswa.noHp || '-',
        'Jenis Kelamin': siswa.jenisKelamin || '-',
        'Tempat Lahir': siswa.tempatLahir || '-',
        'Tanggal Lahir': siswa.tanggalLahir || '-',
        'Jenjang Kelas': siswa.jenjangKelas || '-',
        'Asal Sekolah': siswa.asalSekolah || '-',
        'NIK': siswa.nik || '-',
        'Alamat': siswa.alamatLengkap || '-',
        'Kota': siswa.kota || '-',
        'Provinsi': siswa.provinsi || '-',
        'Kode Pos': siswa.kodePos || '-',
        'Agama': siswa.agama || '-',
        'Status': siswa.statusAktif,
        'Terdaftar Pada': siswa.createdAt ? new Date(siswa.createdAt).toLocaleDateString('id-ID') : '-',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return buffer;
};

// --- 9. RESET SISWA PASSWORD ---
const resetSiswaPassword = async (idSiswa) => {
    // Check if siswa exists
    const siswa = await Siswa.findOne({ where: { idSiswa } });

    if (!siswa) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    // Check if siswa has associated user account
    if (!siswa.idUser) {
        throw new BadRequestError('Siswa tidak memiliki akun user yang terkait.');
    }

    // Get user account
    const user = await Users.findOne({ where: { idUser: siswa.idUser } });

    if (!user) {
        throw new NotFoundError('Akun user tidak ditemukan.');
    }

    // Hash password default "KPMUser"
    const hashedPassword = await bcrypt.hash('KPMUser', 10);

    // Update user password
    await user.update({ password: hashedPassword });

    return {
        idSiswa: siswa.idSiswa,
        namaLengkap: siswa.namaLengkap,
        email: user.email,
        message: 'Password berhasil direset ke default'
    };
};


// --- 11. GET ENROLLMENT DASHBOARD DATA ---
const getEnrollmentDashboard = async (idSiswa) => {
    const ParentProduct1 = require('../../api/v1/parentProduct1/model');
    const ParentProduct2 = require('../../api/v1/parentProduct2/model');

    // 1. Get siswa profile
    const siswa = await Siswa.findByPk(idSiswa, {
        attributes: ['idSiswa', 'namaLengkap', 'jenjangKelas', 'email', 'asalSekolah']
    });

    if (!siswa) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    // 2. Check if profile complete (jenjangKelas required)
    const needsProfileCompletion = !siswa.jenjangKelas;

    // 3. If profile incomplete, return early
    if (needsProfileCompletion) {
        return {
            siswa: siswa.dataValues,
            needsProfileCompletion: true,
            sections: {}
        };
    }

    // 4. Get parent1 with filtered parent2
    const parent1List = await ParentProduct1.findAll({
        where: {
            status: 'Aktif',
            tampilDiDashboard: true
        },
        include: [{
            model: ParentProduct2,
            as: 'parentProduct2s',
            where: {
                status: 'Aktif',
                jenjangKelasIzin: siswa.jenjangKelas
            },
            required: false,
            attributes: ['idParent2', 'namaParent2', 'kapasitasMaksimal']
        }],
        order: [['tautanProduk', 'ASC'], ['namaParent1', 'ASC']]
    });

    // 5. Group by tautanProduk
    const sections = {
        kelasPeriodik: parent1List
            .filter(p => p.tautanProduk === 'Kelas Periodik')
            .map(p => ({
                idParent1: p.idParent1,
                namaParent1: p.namaParent1,
                descParent1: p.descParent1,
                tautanProduk: p.tautanProduk,
                jumlahRuangKelas: p.parentProduct2s?.length || 0
            })),
        kelasInsidental: parent1List
            .filter(p => p.tautanProduk === 'Kelas Insidental')
            .map(p => ({
                idParent1: p.idParent1,
                namaParent1: p.namaParent1,
                descParent1: p.descParent1,
                tautanProduk: p.tautanProduk,
                jumlahRuangKelas: p.parentProduct2s?.length || 0
            })),
        produkKomersial: parent1List
            .filter(p => p.tautanProduk === 'Produk Komersial')
            .map(p => ({
                idParent1: p.idParent1,
                namaParent1: p.namaParent1,
                descParent1: p.descParent1,
                tautanProduk: p.tautanProduk,
                jumlahRuangKelas: p.parentProduct2s?.length || 0
            }))
    };

    return {
        siswa: siswa.dataValues,
        needsProfileCompletion: false,
        sections
    };
};

// --- 12. GET PARENT2 LIST FOR ENROLLMENT ---
const getParent2ForEnrollment = async (idSiswa, idParent1) => {
    const ParentProduct1 = require('../../api/v1/parentProduct1/model');
    const ParentProduct2 = require('../../api/v1/parentProduct2/model');
    const SiswaKelas = require('../../api/v1/siswaKelas/model');

    // 1. Get siswa to check jenjangKelas
    const siswa = await Siswa.findByPk(idSiswa);
    if (!siswa) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    if (!siswa.jenjangKelas) {
        throw new BadRequestError('Lengkapi profil Anda terlebih dahulu sebelum mendaftar kelas.');
    }

    // 2. Get parent1 info
    const parent1 = await ParentProduct1.findByPk(idParent1);
    if (!parent1) {
        throw new NotFoundError(`Parent1 dengan ID: ${idParent1} tidak ditemukan.`);
    }

    // 3. Get parent2 list filtered by jenjangKelas
    const parent2List = await ParentProduct2.findAll({
        where: {
            idParent1,
            status: 'Aktif',
            jenjangKelasIzin: siswa.jenjangKelas
        },
        order: [['namaParent2', 'ASC']]
    });

    // 4. For each parent2, count enrolled students
    const SiswaKelas = require('../../api/v1/siswaKelas/model');
    const ruangKelasWithCapacity = await Promise.all(
        parent2List.map(async (p2) => {
            const enrolledCount = await SiswaKelas.count({
                where: {
                    idParent2: p2.idParent2,
                    statusEnrollment: ['Aktif', 'Pending']
                }
            });

            const tersedia = (p2.kapasitasMaksimal || 0) - enrolledCount;

            return {
                idParent2: p2.idParent2,
                namaParent2: p2.namaParent2,
                descParent2: p2.descParent2,
                jenjangKelasIzin: p2.jenjangKelasIzin,
                tahunAjaran: p2.tahunAjaran,
                kapasitasMaksimal: p2.kapasitasMaksimal,
                siswaEnrolled: enrolledCount,
                tersedia,
                isFull: tersedia <= 0,
                kategoriHargaDaftarUlang: p2.kategoriHargaDaftarUlang,
                hargaDaftarUlang: p2.hargaDaftarUlang
            };
        })
    );

    return {
        parent1: {
            idParent1: parent1.idParent1,
            namaParent1: parent1.namaParent1,
            descParent1: parent1.descParent1
        },
        ruangKelas: ruangKelasWithCapacity
    };
};

// --- 13. COMPLETE SISWA PROFILE ---
const completeProfile = async (idSiswa, data) => {
    const { tempatLahir, tanggalLahir, jenisKelamin, jenjangKelas, asalSekolah, noHp, agama } = data;

    // Validasi jenjangKelas required
    if (!jenjangKelas) {
        throw new BadRequestError('Jenjang Kelas wajib diisi.');
    }

    const siswa = await Siswa.findByPk(idSiswa);
    if (!siswa) {
        throw new NotFoundError(`Siswa dengan ID: ${idSiswa} tidak ditemukan.`);
    }

    // Update profile
    await siswa.update({
        tempatLahir: tempatLahir || siswa.tempatLahir,
        tanggalLahir: tanggalLahir || siswa.tanggalLahir,
        jenisKelamin: jenisKelamin || siswa.jenisKelamin,
        jenjangKelas,  // Always update
        asalSekolah: asalSekolah || siswa.asalSekolah,
        noHp: noHp || siswa.noHp,
        agama: agama || siswa.agama
    });

    return {
        idSiswa: siswa.idSiswa,
        namaLengkap: siswa.namaLengkap,
        jenjangKelas: siswa.jenjangKelas,
        needsProfileCompletion: false
    };
};

// EXPORT SEMUA FUNGSI
module.exports = {
    createSiswa,
    getAllSiswa,
    getSiswaDetail,
    updateSiswa,
    deleteSiswa,
    bulkImportSiswa,
    bulkDeleteSiswa,
    exportSiswaData,
    resetSiswaPassword,
    // New enrollment methods
    getEnrollmentDashboard,
    getParent2ForEnrollment,
    completeProfile,
};
