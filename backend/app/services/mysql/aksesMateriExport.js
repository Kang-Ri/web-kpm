const AksesMateri = require('../../api/v1/aksesMateri/model');
const Siswa = require('../../api/v1/siswa/model');
const Product = require('../../api/v1/product/model');
const XLSX = require('xlsx');

/**
 * Export siswa yang punya akses ke materi tertentu
 * @param {number} idProduk - ID Materi/Product
 * @returns {Promise<Buffer>} - Excel file buffer
 */
const exportSiswaByMateri = async (idProduk) => {
    // Get all access records for this materi
    const aksesRecords = await AksesMateri.findAll({
        where: { idProduk },
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'noHp', 'email', 'jenjangKelas', 'asalSekolah'],
            },
            {
                model: Product,
                as: 'materi',
                attributes: ['namaProduk'],
            }
        ],
        order: [['tanggalAkses', 'DESC']],
    });

    if (aksesRecords.length === 0) {
        return null; // No data
    }

    // Prepare data for Excel
    const data = aksesRecords.map((record, index) => ({
        'No': index + 1,
        'Nama Lengkap': record.siswa?.namaLengkap || '-',
        'Jenjang Kelas': record.siswa?.jenjangKelas || '-',
        'Asal Sekolah': record.siswa?.asalSekolah || '-',
        'Email': record.siswa?.email || '-',
        'No HP': record.siswa?.noHp || '-',
        'Status Akses': record.statusAkses || '-',
        'Tanggal Akses': record.tanggalAkses
            ? new Date(record.tanggalAkses).toLocaleString('id-ID')
            : '-',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 15 }, // Jenjang
        { wch: 25 }, // Sekolah
        { wch: 25 }, // Email
        { wch: 15 }, // HP
        { wch: 15 }, // Status
        { wch: 20 }, // Tanggal
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa Data');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

/**
 * Get list siswa yang enrolled di kelas, dengan info akses & payment untuk materi tertentu
 * @param {number} idProduk - ID Materi/Product
 * @returns {Promise<Array>} - Array of siswa enrolled in class with access info + payment status
 */
const getSiswaByMateri = async (idProduk) => {
    const Order = require('../../api/v1/order/model');
    const SiswaKelas = require('../../api/v1/siswaKelas/model');
    const ParentProduct2 = require('../../api/v1/parentProduct2/model');

    // First, get the materi's parent (kelas/ruang kelas)
    const materi = await Product.findOne({
        where: { idProduk },
        attributes: ['idProduk', 'idParent2', 'namaProduk']
    });

    if (!materi) {
        throw new Error('Materi tidak ditemukan');
    }

    // Get all students enrolled in this kelas
    const siswaKelasRecords = await SiswaKelas.findAll({
        where: {
            idParent2: materi.idParent2,
            statusEnrollment: 'Aktif' // Only active students
        },
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'noHp', 'email', 'jenjangKelas', 'asalSekolah'],
                required: false
            },
            {
                model: ParentProduct2,
                as: 'parentProduct2',
                attributes: ['idParent2', 'namaParent2'],
                required: false
            }
        ],
        order: [['tanggalMasuk', 'DESC']],
    });

    // For each student, get their AksesMateri and Order for this specific materi
    const results = await Promise.all(siswaKelasRecords.map(async (siswaKelas) => {
        if (!siswaKelas.siswa) return null;

        // Get AksesMateri for this student and materi
        const aksesMateri = await AksesMateri.findOne({
            where: {
                idSiswa: siswaKelas.siswa.idSiswa,
                idProduk: idProduk
            },
            include: {
                model: Order,
                as: 'order',
                attributes: ['idOrder', 'hargaFinal', 'statusPembayaran', 'tglOrder', 'paidAt'],
                required: false
            }
        });

        return {
            idAksesMateri: aksesMateri?.idAksesMateri || null,
            statusAkses: aksesMateri?.statusAkses || 'Locked',
            tanggalAkses: aksesMateri?.tanggalAkses || null,
            siswa: siswaKelas.siswa,
            order: aksesMateri?.order || null,
            ruangKelas: siswaKelas.parentProduct2
        };
    }));

    // Filter out null results and return
    return results.filter(r => r !== null);
};

module.exports = {
    exportSiswaByMateri,
    getSiswaByMateri,
};
