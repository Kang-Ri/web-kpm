const MateriButtonClick = require('../../api/v1/materiButtonClick/model');
const MateriButton = require('../../api/v1/materiButton/model');
const Siswa = require('../../api/v1/siswa/model');
const Product = require('../../api/v1/product/model');
const XLSX = require('xlsx');

/**
 * Export history klik button materi untuk satu Ruang Kelas
 * @param {number} idParent2 - ID Ruang Kelas
 * @returns {Promise<Buffer>} - Excel file buffer
 */
const exportClicksByClassroom = async (idParent2) => {
    // Get all click records for all materi in this classroom
    const clicks = await MateriButtonClick.findAll({
        include: [
            {
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'nisn', 'email'],
            },
            {
                model: MateriButton,
                as: 'button',
                attributes: ['idButton', 'namaButton', 'judulButton'],
                required: true,
                include: [{
                    model: Product,
                    as: 'product',
                    where: { idParent2 },
                    attributes: ['namaProduk'],
                    required: true
                }]
            }
        ],
        order: [['tanggalKlik', 'DESC']],
    });

    if (clicks.length === 0) {
        return null;
    }

    // Format data for Excel
    const data = clicks.map((c, index) => ({
        'No': index + 1,
        'Nama Materi': c.button?.product?.namaProduk || '-',
        'Nama Siswa': c.siswa?.namaLengkap || '-',
        'NISN': c.siswa?.nisn || '-',
        'Tombol': c.button?.namaButton || c.button?.judulButton || '-',
        'Waktu Klik': c.tanggalKlik
            ? new Date(c.tanggalKlik).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            : '-',
    }));

    // Generate Excel
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Column widths
    worksheet['!cols'] = [
        { wch: 5 },  // No
        { wch: 30 }, // Nama Materi
        { wch: 25 }, // Nama Siswa
        { wch: 15 }, // NISN
        { wch: 20 }, // Tombol
        { wch: 25 }, // Waktu Klik
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Log Klik Materi');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
    exportClicksByClassroom
};
