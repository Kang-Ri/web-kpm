const Siswa = require('../../api/v1/siswa/model');
const Users = require('../../api/v1/users/model');
const SiswaKelas = require('../../api/v1/siswaKelas/model');
const ParentProduct2 = require('../../api/v1/parentProduct2/model');
const { BadRequestError } = require('../../errors');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');

/**
 * Generate template Excel untuk bulk import siswa
 */
/**
 * Generate template Excel untuk bulk import siswa
 */
const generateBulkSiswaTemplate = (ruangKelasList = []) => {
    const exampleData = [
        ['ID Ruang Kelas', 'Email', 'Nama Lengkap', 'Jenjang Kelas', 'Asal Sekolah', 'Status Enrollment'],
        ['1001', 'siswa1@example.com', 'Budi Santoso', '3', 'SMAN 1 Jakarta', 'Aktif'],
        ['1001', 'siswa2@example.com', 'Ani Wijaya', '3', 'SMPN 2 Bandung', 'Pending'],
        ['1002', 'siswa3@example.com', 'Dedi Pramono', '4', 'SMAN 3 Surabaya', 'Aktif'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, // ID Ruang Kelas
        { wch: 30 }, // Email
        { wch: 30 }, // Nama Lengkap
        { wch: 15 }, // Jenjang Kelas
        { wch: 30 }, // Asal Sekolah
        { wch: 20 }, // Status Enrollment
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');

    // Add instruction sheet
    const instructions = [
        ['INSTRUKSI PENGISIAN'],
        [''],
        ['1. ID Ruang Kelas: Wajib diisi, lihat tabel ID Ruang Kelas di modal'],
        ['2. Email: Wajib diisi, harus unique (tidak boleh duplikat)'],
        ['3. Nama Lengkap: Wajib diisi'],
        ['4. Jenjang Kelas: Angka 1-12, harus sesuai dengan jenjangKelasIzin ruang kelas'],
        ['5. Asal Sekolah: Opsional'],
        ['6. Status Enrollment: Wajib diisi, pilih salah satu: Pending, Aktif, Lulus, Dropout'],
        [''],
        ['CATATAN:'],
        ['- Jika email BELUM terdaftar, sistem akan membuat akun baru otomatis'],
        ['- Password default: email123 (siswa harus ganti password)'],
        ['- Siswa akan langsung di-enroll ke ruang kelas sesuai ID'],
        ['- Status enrollment harus ditulis PERSIS seperti contoh (huruf besar/kecil harus sama)'],
        ['- Hapus baris contoh sebelum upload'],
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instruksi');

    // Add ruang kelas list if provided
    if (ruangKelasList && ruangKelasList.length > 0) {
        const kelasData = [
            ['ID Ruang Kelas', 'Nama Ruang Kelas', 'Jenjang Kelas Izin'],
            ...ruangKelasList.map(k => [
                k.idParent2,
                k.namaParent2,
                k.jenjangKelasIzin && k.jenjangKelasIzin.length > 0 ? k.jenjangKelasIzin.join(', ') : 'Semua'
            ])
        ];

        const kelasSheet = XLSX.utils.aoa_to_sheet(kelasData);
        kelasSheet['!cols'] = [
            { wch: 15 },
            { wch: 40 },
            { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, kelasSheet, 'Daftar Ruang Kelas');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Bulk import siswa dari Excel
 * - Create account jika belum ada
 * - Enroll ke ruang kelas sesuai ID dari Excel
 */
const bulkImportSiswaFromExcel = async (fileBuffer, idParent1) => {
    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
        throw new BadRequestError('File Excel kosong atau format tidak sesuai');
    }

    const results = {
        success: [],
        failed: [],
        total: data.length
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel row (header = 1)

        try {
            // Validate required fields
            if (!row['ID Ruang Kelas']) {
                throw new Error('ID Ruang Kelas wajib diisi');
            }

            if (!row['Email']) {
                throw new Error('Email wajib diisi');
            }

            if (!row['Nama Lengkap']) {
                throw new Error('Nama Lengkap wajib diisi');
            }

            const idParent2 = parseInt(row['ID Ruang Kelas']);
            const email = String(row['Email']).trim().toLowerCase();
            const namaLengkap = String(row['Nama Lengkap']).trim();
            const jenjangKelas = row['Jenjang Kelas'] ? String(row['Jenjang Kelas']).trim() : null;
            const statusEnrollment = row['Status Enrollment'] ? String(row['Status Enrollment']).trim() : null;

            // Validate status enrollment
            const validStatuses = ['Pending', 'Aktif', 'Lulus', 'Dropout'];
            if (!statusEnrollment) {
                throw new Error('Status Enrollment wajib diisi');
            }
            if (!validStatuses.includes(statusEnrollment)) {
                throw new Error(`Status Enrollment tidak valid. Pilih: ${validStatuses.join(', ')}`);
            }

            // Get ruang kelas info
            const kelas = await ParentProduct2.findOne({ where: { idParent2 } });
            if (!kelas) {
                throw new Error(`Ruang kelas dengan ID ${idParent2} tidak ditemukan`);
            }

            // Validate jenjangKelasIzin
            if (kelas.jenjangKelasIzin && kelas.jenjangKelasIzin.length > 0) {
                if (!jenjangKelas) {
                    throw new Error('Jenjang Kelas wajib diisi');
                }
                const allowedJenjang = kelas.jenjangKelasIzin.map(j => String(j));
                if (!allowedJenjang.includes(jenjangKelas)) {
                    throw new Error(`Jenjang kelas ${jenjangKelas} tidak diizinkan untuk ${kelas.namaParent2}. Hanya: ${allowedJenjang.join(', ')}`);
                }
            }

            // Check if email already exists
            let siswa = await Siswa.findOne({ where: { email } });
            let isNewAccount = false;

            if (!siswa) {
                // CREATE NEW ACCOUNT
                isNewAccount = true;

                // 1. Create user account
                const defaultPassword = 'email123'; // Default password
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                const newUser = await Users.create({
                    email,
                    password: hashedPassword,
                    namaLengkap,
                    noHp: null,
                    statusAktif: 'Aktif',
                    role: 'Siswa',
                    idRole: 5  // Role ID untuk Siswa
                });

                // 2. Create siswa record
                siswa = await Siswa.create({
                    idUser: newUser.idUser,
                    email,
                    namaLengkap,
                    tempatLahir: null,
                    tanggalLahir: null,
                    jenisKelamin: null,
                    jenjangKelas: jenjangKelas,
                    asalSekolah: row['Asal Sekolah'] ? String(row['Asal Sekolah']).trim() : null,
                    noHp: null,
                    statusAktif: 'Aktif'
                });
            }

            // Check if already enrolled
            const existingEnrollment = await SiswaKelas.findOne({
                where: { idSiswa: siswa.idSiswa, idParent2 }
            });

            if (existingEnrollment) {
                throw new Error('Sudah terdaftar di kelas ini');
            }

            // ENROLL to class with status from Excel
            const enrollment = await SiswaKelas.create({
                idSiswa: siswa.idSiswa,
                idParent2,
                sudahDaftarUlang: statusEnrollment === 'Aktif',
                idOrderDaftarUlang: null,
                tanggalDaftarUlang: statusEnrollment === 'Aktif' ? new Date() : null,
                statusEnrollment: statusEnrollment,  // Use status from Excel
                tanggalMasuk: new Date(),
            });

            results.success.push({
                row: rowNumber,
                email,
                namaLengkap,
                statusEnrollment,
                isNewAccount,
                id: enrollment.idSiswaKelas
            });

        } catch (error) {
            results.failed.push({
                row: rowNumber,
                email: row['Email'] || '-',
                namaLengkap: row['Nama Lengkap'] || '-',
                error: error.message
            });
        }
    }

    return results;
};

module.exports = {
    generateBulkSiswaTemplate,
    bulkImportSiswaFromExcel,
};
