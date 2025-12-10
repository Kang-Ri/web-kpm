const { StatusCodes } = require("http-status-codes");
const {
    getAllParentProduct2,
    getOneParentProduct2,
    createParentProduct2,
    updateParentProduct2,
    deleteParentProduct2,
} = require("../../../services/mysql/parentProduct2"); 

// --- Index (Read All) ---
const index = async (req, res, next) => {
    try {
        const result = await getAllParentProduct2(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengambil semua ParentProduct2",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Find (Read One) ---
const find = async (req, res, next) => {
    try {
        const result = await getOneParentProduct2(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengambil ParentProduct2",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Create ---
const create = async (req, res, next) => {
    try {
        const result = await createParentProduct2(req);

        res.status(StatusCodes.CREATED).json({
            message: "Success menambah ParentProduct2",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Update ---
const update = async (req, res, next) => {
    try {
        const result = await updateParentProduct2(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengubah ParentProduct2",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Delete ---
const destroy = async (req, res, next) => {
    try {
        await deleteParentProduct2(req);

        res.status(StatusCodes.OK).json({
            message: "Success menghapus ParentProduct2",
        });
    } catch (error) {
        next(error);
    }
};


module.exports = { index, find, create, update, destroy };