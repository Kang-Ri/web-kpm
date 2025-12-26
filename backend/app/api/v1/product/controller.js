const { StatusCodes } = require("http-status-codes");
const {
    getAllProduct,
    getOneProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../../../services/mysql/product");

const {
    importMateriFromExcel,
    generateMateriTemplate,
    bulkImportMateriFromExcel,
    generateBulkMateriTemplate,
} = require("../../../services/mysql/productImport");

// --- Index (Read All) ---
const index = async (req, res, next) => {
    try {
        const result = await getAllProduct(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengambil semua Produk",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Find (Read One) ---
const find = async (req, res, next) => {
    try {
        const result = await getOneProduct(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengambil Produk",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Create ---
const create = async (req, res, next) => {
    try {
        const result = await createProduct(req);

        res.status(StatusCodes.CREATED).json({
            message: "Success menambah Produk",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Update ---
const update = async (req, res, next) => {
    try {
        const result = await updateProduct(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengubah Produk",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Delete ---
const destroy = async (req, res, next) => {
    try {
        await deleteProduct(req);

        res.status(StatusCodes.OK).json({
            message: "Success menghapus Produk",
        });
    } catch (error) {
        next(error);
    }
};


// --- Import Materi from Excel ---
const importMateri = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'File Excel tidak ditemukan',
            });
        }

        const { idParent2 } = req.body;
        if (!idParent2) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'ID Ruang Kelas (idParent2) wajib diisi',
            });
        }

        const result = await importMateriFromExcel(req.file.buffer, parseInt(idParent2));

        res.status(StatusCodes.OK).json({
            message: 'Import materi selesai',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Download Template Excel ---
const downloadTemplate = async (req, res, next) => {
    try {
        const buffer = generateMateriTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template-import-materi.xlsx"');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

// --- Bulk Import Materi (Multiple Ruang Kelas) ---
const bulkImportMateri = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new BadRequestError('File Excel wajib diupload');
        }

        const result = await bulkImportMateriFromExcel(req.file.buffer);

        res.status(StatusCodes.OK).json({
            message: 'Bulk import materi selesai',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Download Bulk Template Excel ---
const downloadBulkTemplate = async (req, res, next) => {
    try {
        const buffer = generateBulkMateriTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template-bulk-import-materi.xlsx"');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    index,
    find,
    create,
    update,
    destroy,
    importMateri,
    downloadTemplate,
    bulkImportMateri,
    downloadBulkTemplate
};