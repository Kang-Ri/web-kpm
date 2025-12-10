const { StatusCodes } = require("http-status-codes");
const {
    getAllProduct,
    getOneProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../../../services/mysql/product"); 

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


module.exports = { index, find, create, update, destroy };