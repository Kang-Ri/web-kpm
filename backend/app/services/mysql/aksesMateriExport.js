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
 * Get list siswa yang punya akses ke materi
 * @param {number} idProduk - ID Materi/Product
 * @returns {Promise<Array>} - Array of siswa with access info + payment status
 */
const getSiswaByMateri = async (idProduk) => {
    const Order = require('../../api/v1/order/model');

    const aksesRecords = await AksesMateri.findAll({
        where: { idProduk },
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'noHp', 'email', 'jenjangKelas', 'asalSekolah'],
                required: false
            },
            {
                model: Order,
                as: 'order',
                attributes: ['idOrder', 'hargaFinal', 'statusPembayaran', 'tglOrder', 'paidAt'],
                required: false
            }
        ],
        order: [['tanggalAkses', 'DESC']],
    });

    return aksesRecords;
};

module.exports = {
    exportSiswaByMateri,
    getSiswaByMateri,
};
