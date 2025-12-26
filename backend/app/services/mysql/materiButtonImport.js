const MateriButton = require('../../api/v1/materiButton/model');
const Product = require('../../api/v1/product/model');
const xlsx = require('xlsx');
const { BadRequestError } = require('../../errors');

/**
 * Bulk Import MateriButton dari Excel
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {number} idParent2 - ID Ruang Kelas (for validation)
 * @returns {Object} - Import summary (success, failed)
 */
const bulkImportMateriButtonFromExcel = async (fileBuffer, idParent2) => {
    try {
        // Parse Excel
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            throw new BadRequestError('File Excel kosong atau tidak valid');
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
                if (!row['ID Produk']) {
                    throw new Error('ID Produk wajib diisi');
                }

                if (!row['Nama Button']) {
                    throw new Error('Nama Button wajib diisi');
                }

                if (!row['Link']) {
                    throw new Error('Link wajib diisi');
                }

                const idProduk = parseInt(row['ID Produk']);
                if (isNaN(idProduk)) {
                    throw new Error('ID Produk harus berupa angka');
                }

                // Validate Produk exists and belongs to the Ruang Kelas
                const produk = await Product.findOne({
                    where: { idProduk: idProduk }
                });

                if (!produk) {
                    throw new Error(`Materi dengan ID ${idProduk} tidak ditemukan`);
                }

                if (produk.idParent2 !== idParent2) {
                    throw new Error(`Materi ID ${idProduk} bukan bagian dari ruang kelas ini`);
                }

                // Check duplicate button name for the same Materi
                const existingButton = await MateriButton.findOne({
                    where: {
                        idProduk: idProduk,
                        namaButton: row['Nama Button']
                    }
                });

                if (existingButton) {
                    throw new Error(`Button "${row['Nama Button']}" sudah ada untuk materi "${produk.namaProduk}"`);
                }

                // Create MateriButton
                const newButton = await MateriButton.create({
                    idProduk: idProduk,
                    judulButton: row['Judul'] || null,
                    namaButton: row['Nama Button'],
                    linkTujuan: row['Link'],
                    deskripsiButton: row['Deskripsi'] || null,
                    statusButton: 'Active', // Default active
                });

                results.success.push({
                    row: rowNumber,
                    namaButton: row['Nama Button'],
                    idProduk: idProduk,
                    namaProduk: produk.namaProduk,
                    id: newButton.idButton
                });

            } catch (error) {
                results.failed.push({
                    row: rowNumber,
                    namaButton: row['Nama Button'] || 'N/A',
                    idProduk: row['ID Produk'] || 'N/A',
                    error: error.message
                });
            }
        }

        return results;

    } catch (error) {
        throw new BadRequestError(`Import gagal: ${error.message}`);
    }
};

/**
 * Generate template Excel untuk bulk import MateriButton
 * @returns {Buffer} - Excel file buffer
 */
const generateBulkMateriButtonTemplate = () => {
    const templateData = [
        {
            'ID Produk': 25,
            'Judul': 'Download Materi',
            'Nama Button': 'Download PDF',
            'Link': 'https://drive.google.com/...',
            'Deskripsi': 'File materi dalam format PDF'
        },
        {
            'ID Produk': 25,
            'Judul': 'Video Tutorial',
            'Nama Button': 'Tonton Video',
            'Link': 'https://youtube.com/...',
            'Deskripsi': 'Video penjelasan materi'
        },
        {
            'ID Produk': 26,
            'Judul': 'Latihan Soal',
            'Nama Button': 'Kerjakan Quiz',
            'Link': 'https://quiz.com/...',
            'Deskripsi': 'Quiz interaktif'
        }
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 12 }, // ID Produk
        { wch: 20 }, // Judul
        { wch: 20 }, // Nama Button
        { wch: 50 }, // Link
        { wch: 35 }, // Deskripsi
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Button');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

module.exports = {
    bulkImportMateriButtonFromExcel,
    generateBulkMateriButtonTemplate,
};
