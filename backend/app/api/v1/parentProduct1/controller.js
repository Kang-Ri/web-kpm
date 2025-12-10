// api/v1/parentProduct1/controller.js

const { StatusCodes } = require("http-status-codes");
const {
    getAllParentProduct1,
    getOneParentProduct1,
    createParentProduct1,
    updateParentProduct1,
    deleteParentProduct1,
} = require("../../../services/mysql/parentProduct1");

// --- Index (Read All) ---
const index = async (req, res, next) => {
    try {
        const result = await getAllParentProduct1(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengambil semua ParentProduct1",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Find (Read One) ---
const find = async (req, res, next) => {
    try {
        const result = await getOneParentProduct1(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengambil ParentProduct1",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Create ---
const create = async (req, res, next) => {
    try {
        // Logika bisnis utama ditangani oleh service layer
        const result = await createParentProduct1(req);

        res.status(StatusCodes.CREATED).json({
            message: "Success menambah ParentProduct1",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Update ---
const update = async (req, res, next) => {
    try {
        const result = await updateParentProduct1(req);

        res.status(StatusCodes.OK).json({
            message: "Success mengubah ParentProduct1",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- Delete ---
const destroy = async (req, res, next) => {
    try {
        await deleteParentProduct1(req);

        res.status(StatusCodes.OK).json({
            message: "Success menghapus ParentProduct1",
        });
    } catch (error) {
        next(error);
    }
};


module.exports = { index, find, create, update, destroy };