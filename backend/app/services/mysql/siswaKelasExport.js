const SiswaKelas = require('../../api/v1/siswaKelas/model');
const Siswa = require('../../api/v1/siswa/model');
const ParentProduct2 = require('../../api/v1/parentProduct2/model');
const { BadRequestError } = require('../../errors');
const xlsx = require('xlsx');

// Export siswa by kelas to Excel
const exportSiswaKelas = async (req) => {
    const { idParent2, status } = req.query;

    if (!idParent2) {
        throw new BadRequestError('ID Kelas (idParent2) wajib diisi.');
    }

    // Build where clause
    let whereClause = { idParent2 };

    if (status) {
        whereClause.statusEnrollment = status;
    }

    // Get enrollment data with siswa details
    const enrollments = await SiswaKelas.findAll({
        where: whereClause,
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'jenjangKelas', 'asalSekolah', 'noHp', 'email'],
            },
            {
                model: ParentProduct2,
                as: 'ruangKelas',
                attributes: ['namaParent2', 'tahunAjaran'],
            }
        ],
        order: [['tanggalMasuk', 'DESC']],
    });

    // Transform data for Excel
    const excelData = enrollments.map((enrollment, index) => ({
        'No': index + 1,
        'Nama Lengkap': enrollment.siswa?.namaLengkap || '-',
        'Jenjang Kelas': enrollment.siswa?.jenjangKelas || '-',
        'Asal Sekolah': enrollment.siswa?.asalSekolah || '-',
        'No HP': enrollment.siswa?.noHp || '-',
        'Email': enrollment.siswa?.email || '-',
        'Status Enrollment': enrollment.statusEnrollment || '-',
        'Tanggal Masuk': enrollment.tanggalMasuk
            ? new Date(enrollment.tanggalMasuk).toLocaleDateString('id-ID')
            : '-',
        'Sudah Daftar Ulang': enrollment.sudahDaftarUlang ? 'Ya' : 'Tidak',
        'Tanggal Daftar Ulang': enrollment.tanggalDaftarUlang
            ? new Date(enrollment.tanggalDaftarUlang).toLocaleDateString('id-ID')
            : '-',
    }));

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama Lengkap
        { wch: 15 }, // Jenjang Kelas
        { wch: 25 }, // Asal Sekolah
        { wch: 15 }, // No HP
        { wch: 30 }, // Email
        { wch: 18 }, // Status Enrollment
        { wch: 18 }, // Tanggal Masuk
        { wch: 18 }, // Sudah Daftar Ulang
        { wch: 20 }, // Tanggal Daftar Ulang
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return excelBuffer;
};

module.exports = {
    exportSiswaKelas,
};
