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
    const { Sequelize } = require('sequelize');
    const sequelize = require('../../db/index');

    // Get the materi's parent first
    const materi = await Product.findOne({
        where: { idProduk },
        attributes: ['idProduk', 'idParent2', 'namaProduk']
    });

    if (!materi) {
        throw new Error('Materi tidak ditemukan');
    }

    // Use raw query with proper JOINs to avoid N+1 and association issues
    const query = `
        SELECT DISTINCT
            sk.idSiswaKelas,
            sk.idSiswa,
            sk.tanggalMasuk,
            sk.statusEnrollment,
            s.namaLengkap,
            s.email,
            s.noHp,
            s.jenjangKelas,
            s.asalSekolah,
            pp2.namaParent2,
            am.idAkses,
            am.statusAkses,
            am.tanggalAkses,
            o.idOrder,
            o.hargaFinal,
            o.statusPembayaran,
            o.tglOrder,
            o.paidAt
        FROM siswaKelas sk
        LEFT JOIN siswa s ON sk.idSiswa = s.idSiswa
        LEFT JOIN parentProduct2 pp2 ON sk.idParent2 = pp2.idParent2
        LEFT JOIN aksesMateri am ON sk.idSiswa = am.idSiswa AND am.idProduk = :idProduk
        LEFT JOIN \`order\` o ON am.idOrder = o.idOrder
        WHERE sk.idParent2 = :idParent2
            AND sk.statusEnrollment = 'Aktif'
            AND s.idSiswa IS NOT NULL
        ORDER BY sk.tanggalMasuk DESC
    `;

    const results = await sequelize.query(query, {
        replacements: {
            idProduk: idProduk,
            idParent2: materi.idParent2
        },
        type: Sequelize.QueryTypes.SELECT
    });

    // Transform raw results to match expected format
    return results.map(row => ({
        idAksesMateri: row.idAkses || null,
        statusAkses: row.statusAkses || 'Locked',
        tanggalAkses: row.tanggalAkses || null,
        siswa: {
            idSiswa: row.idSiswa,
            namaLengkap: row.namaLengkap,
            email: row.email,
            noHp: row.noHp,
            jenjangKelas: row.jenjangKelas,
            asalSekolah: row.asalSekolah
        },
        order: row.idOrder ? {
            idOrder: row.idOrder,
            hargaFinal: row.hargaFinal,
            statusPembayaran: row.statusPembayaran,
            tglOrder: row.tglOrder,
            paidAt: row.paidAt
        } : null,
        ruangKelas: {
            namaParent2: row.namaParent2
        }
    }));
};

module.exports = {
    exportSiswaByMateri,
    getSiswaByMateri,
};
