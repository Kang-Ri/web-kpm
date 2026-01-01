const Product = require('../../api/v1/product/model');
const xlsx = require('xlsx');
const { BadRequestError } = require('../../errors');

/**
 * Import Materi dari Excel file
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {number} idParent2 - ID Ruang Kelas
 * @returns {Object} - Import summary (success, failed)
 */
const importMateriFromExcel = async (fileBuffer, idParent2) => {
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
                if (!row['Nama Materi']) {
                    throw new Error('Nama Materi wajib diisi');
                }

                // Check duplicate in same Ruang Kelas
                const existing = await Product.findOne({
                    where: {
                        namaProduk: row['Nama Materi'],
                        idParent2: idParent2
                    }
                });

                if (existing) {
                    throw new Error(`Materi "${row['Nama Materi']}" sudah ada di ruang kelas ini`);
                }

                // Map kategoriHarga
                let kategoriHarga = 'Gratis';
                if (row['Kategori Harga']) {
                    const kategori = row['Kategori Harga'].toString().toLowerCase();
                    if (kategori.includes('seikhlasnya')) kategoriHarga = 'Seikhlasnya';
                    else if (kategori.includes('bernominal')) kategoriHarga = 'Bernominal';
                }

                // Map authProduk
                let authProduk = 'Umum';
                if (row['Auth'] && row['Auth'].toString().toLowerCase().includes('khusus')) {
                    authProduk = 'Khusus';
                }

                // Parse Tanggal Publish & determine status
                let statusProduk = 'Draft';
                let tanggalPublish = null;

                if (row['Tanggal Publish']) {
                    const dateStr = row['Tanggal Publish'].toString().trim();
                    if (dateStr) {
                        // Try to parse datetime (supports YYYY-MM-DD HH:mm:ss or YYYY-MM-DD)
                        const parsedDate = new Date(dateStr);
                        if (!isNaN(parsedDate.getTime())) {
                            tanggalPublish = parsedDate;
                            // Auto set to Publish if date is provided
                            statusProduk = 'Publish';
                        }
                    }
                }

                // Create materi (jenisProduk always 'Materi', iconProduk empty)
                const newMateri = await Product.create({
                    idParent2: idParent2,
                    namaProduk: row['Nama Materi'],
                    descProduk: row['Deskripsi'] || '',
                    jenisProduk: 'Materi', // Auto-set
                    kategoriHarga: kategoriHarga,
                    hargaJual: kategoriHarga === 'Bernominal' ? (parseFloat(row['Harga Jual']) || 0) : 0,
                    hargaCoret: parseFloat(row['Harga Coret']) || 0,
                    authProduk: authProduk,
                    iconProduk: '', // Not used
                    statusProduk: statusProduk,
                    tanggalPublish: tanggalPublish,
                });

                results.success.push({
                    row: rowNumber,
                    name: row['Nama Materi'],
                    id: newMateri.idProduk
                });

            } catch (error) {
                results.failed.push({
                    row: rowNumber,
                    name: row['Nama Materi'] || 'N/A',
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
 * Generate template Excel untuk import materi
 * @returns {Buffer} - Excel file buffer
 */
const generateMateriTemplate = () => {
    const templateData = [
        {
            'Nama Materi': 'Contoh Materi 1',
            'Deskripsi': 'Deskripsi singkat materi',
            'Jenis Produk': 'Materi',
            'Kategori Harga': 'Gratis',
            'Harga Jual': 0,
            'Harga Coret': 0,
            'Auth': 'Umum',
            'Icon': '',
            'Status': 'Draft'
        },
        {
            'Nama Materi': 'Contoh Materi 2',
            'Deskripsi': 'Materi berbayar',
            'Jenis Produk': 'Materi',
            'Kategori Harga': 'Bernominal',
            'Harga Jual': 100000,
            'Harga Coret': 150000,
            'Auth': 'Khusus',
            'Icon': '',
            'Status': 'Publish'
        }
    ];

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Nama Materi
        { wch: 30 }, // Deskripsi
        { wch: 15 }, // Jenis Produk
        { wch: 15 }, // Kategori Harga
        { wch: 12 }, // Harga Jual
        { wch: 12 }, // Harga Coret
        { wch: 10 }, // Auth
        { wch: 15 }, // Icon
        { wch: 10 }, // Status
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Materi');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

/**
 * Bulk Import Materi dari Excel (dengan idParent2 di Excel)
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Object} - Import summary (success, failed)
 */
const bulkImportMateriFromExcel = async (fileBuffer) => {
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
                if (!row['ID Ruang Kelas']) {
                    throw new Error('ID Ruang Kelas wajib diisi');
                }

                if (!row['Nama Materi']) {
                    throw new Error('Nama Materi wajib diisi');
                }

                const idParent2 = parseInt(row['ID Ruang Kelas']);
                if (isNaN(idParent2)) {
                    throw new Error('ID Ruang Kelas harus berupa angka');
                }

                // Check duplicate in same Ruang Kelas
                const existing = await Product.findOne({
                    where: {
                        namaProduk: row['Nama Materi'],
                        idParent2: idParent2
                    }
                });

                if (existing) {
                    throw new Error(`Materi "${row['Nama Materi']}" sudah ada di ruang kelas ID ${idParent2}`);
                }

                // Map kategoriHarga
                let kategoriHarga = 'Gratis';
                if (row['Kategori Harga']) {
                    const kategori = row['Kategori Harga'].toString().toLowerCase();
                    if (kategori.includes('seikhlasnya')) kategoriHarga = 'Seikhlasnya';
                    else if (kategori.includes('bernominal')) kategoriHarga = 'Bernominal';
                }

                // Map authProduk
                let authProduk = 'Umum';
                if (row['Auth'] && row['Auth'].toString().toLowerCase().includes('khusus')) {
                    authProduk = 'Khusus';
                }

                // Parse Tanggal Publish & determine status
                let statusProduk = 'Draft';
                let tanggalPublish = null;

                if (row['Tanggal Publish']) {
                    const dateStr = row['Tanggal Publish'].toString().trim();
                    if (dateStr) {
                        const parsedDate = new Date(dateStr);
                        if (!isNaN(parsedDate.getTime())) {
                            tanggalPublish = parsedDate;
                            statusProduk = 'Publish';
                        }
                    }
                }

                // Create materi
                const newMateri = await Product.create({
                    idParent2: idParent2,
                    namaProduk: row['Nama Materi'],
                    descProduk: row['Deskripsi'] || '',
                    jenisProduk: 'Materi',
                    kategoriHarga: kategoriHarga,
                    hargaJual: kategoriHarga === 'Bernominal' ? (parseFloat(row['Harga Jual']) || 0) : 0,
                    hargaCoret: parseFloat(row['Harga Coret']) || 0,
                    authProduk: authProduk,
                    iconProduk: '',
                    statusProduk: statusProduk,
                    tanggalPublish: tanggalPublish,
                });

                // Handle form duplication if ID Form is provided
                if (row['ID Form']) {
                    const idFormTemplate = parseInt(row['ID Form']);
                    if (!isNaN(idFormTemplate) && idFormTemplate > 0) {
                        try {
                            const { duplicateFormForProduct } = require('./forms');
                            await duplicateFormForProduct(
                                newMateri.idProduk,
                                idFormTemplate,
                                'product'
                            );
                            console.log(`✅ Form ${idFormTemplate} duplicated for materi ${newMateri.idProduk}`);
                        } catch (formError) {
                            console.error(`⚠️ Failed to duplicate form for row ${rowNumber}:`, formError.message);
                            // Don't fail the import, just log warning
                        }
                    }
                }

                results.success.push({
                    row: rowNumber,
                    name: row['Nama Materi'],
                    idParent2: idParent2,
                    id: newMateri.idProduk
                });

            } catch (error) {
                results.failed.push({
                    row: rowNumber,
                    name: row['Nama Materi'] || 'N/A',
                    idParent2: row['ID Ruang Kelas'] || 'N/A',
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
 * Generate template Excel untuk bulk import materi kolektif
 * @returns {Buffer} - Excel file buffer
 */
const generateBulkMateriTemplate = () => {
    const templateData = [
        {
            'ID Ruang Kelas': 23,
            'Nama Materi': 'Contoh Materi 1',
            'Deskripsi': 'Deskripsi singkat materi',
            'Kategori Harga': 'Gratis',
            'Harga Jual': 0,
            'Harga Coret': 0,
            'Auth': 'Umum',
            'Tanggal Publish': ''
        },
        {
            'ID Ruang Kelas': 23,
            'Nama Materi': 'Contoh Materi 2',
            'Deskripsi': 'Materi berbayar',
            'Kategori Harga': 'Bernominal',
            'Harga Jual': 100000,
            'Harga Coret': 150000,
            'Auth': 'Khusus',
            'Tanggal Publish': '2024-12-25 14:30:00'
        }
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 18 }, // ID Ruang Kelas
        { wch: 25 }, // Nama Materi
        { wch: 35 }, // Deskripsi
        { wch: 18 }, // Kategori Harga
        { wch: 12 }, // Harga Jual
        { wch: 12 }, // Harga Coret
        { wch: 10 }, // Auth
        { wch: 20 }, // Tanggal Publish
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Materi');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

module.exports = {
    importMateriFromExcel,
    generateMateriTemplate,
    bulkImportMateriFromExcel,
    generateBulkMateriTemplate,
};
