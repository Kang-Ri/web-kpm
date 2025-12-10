const { StatusCodes } = require('http-status-codes');
const {
    grantAccess,
    getAllAccess,
    getAccessDetail,
    revokeAccess,
    deleteAccess,
} = require('../../../services/mysql/aksesMateri');

// GRANT Access (Unlock)
const grant = async (req, res, next) => {
    try {
        const result = await grantAccess(req);

        res.status(StatusCodes.CREATED).json({
            message: 'Akses materi berhasil diberikan',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ALL Access
const index = async (req, res, next) => {
    try {
        const result = await getAllAccess(req);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil semua data akses',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ONE Access
const find = async (req, res, next) => {
    try {
        const { idAkses } = req.params;
        const result = await getAccessDetail(idAkses);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil detail akses',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// REVOKE Access (Lock)
const revoke = async (req, res, next) => {
    try {
        const { idAkses } = req.params;
        const result = await revokeAccess(idAkses);

        res.status(StatusCodes.OK).json({
            message: 'Akses materi berhasil dicabut',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// DELETE Access
const destroy = async (req, res, next) => {
    try {
        const { idAkses } = req.params;
        const result = await deleteAccess(idAkses);

        res.status(StatusCodes.OK).json({
            message: 'Data akses berhasil dihapus',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    grant,
    index,
    find,
    revoke,
    destroy,
};
