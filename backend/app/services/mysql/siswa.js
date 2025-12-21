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
};
