const { StatusCodes } = require('http-status-codes');
const {
    createButton,
    getAllButtons,
    getActiveButtons,
    getButtonDetail,
    updateButton,
    deleteButton,
} = require('../../../services/mysql/materiButton');

// CREATE Button
const create = async (req, res, next) => {
    try {
        const result = await createButton(req);

        res.status(StatusCodes.CREATED).json({
            message: 'Button materi berhasil dibuat',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ALL Buttons
const index = async (req, res, next) => {
    try {
        const result = await getAllButtons(req);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil semua button',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ACTIVE Buttons (untuk siswa)
const getActive = async (req, res, next) => {
    try {
        const { idProduk } = req.params;
        const result = await getActiveButtons(idProduk);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil button aktif',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ONE Button
const find = async (req, res, next) => {
    try {
        const { idButton } = req.params;
        const result = await getButtonDetail(idButton);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil detail button',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// UPDATE Button
const update = async (req, res, next) => {
    try {
        const { idButton } = req.params;
        const result = await updateButton(idButton, req.body);

        res.status(StatusCodes.OK).json({
            message: 'Button berhasil diupdate',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// DELETE Button
const destroy = async (req, res, next) => {
    try {
        const { idButton } = req.params;
        const result = await deleteButton(idButton);

        res.status(StatusCodes.OK).json({
            message: 'Button berhasil dihapus',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    index,
    getActive,
    find,
    update,
    destroy,
};
