const { StatusCodes } = require('http-status-codes');
const {
    createSiswa,
    getAllSiswa,
    getSiswaDetail,
    updateSiswa,
    deleteSiswa,
} = require('../../../services/mysql/siswa');

// CREATE Siswa
const create = async (req, res, next) => {
    try {
        const result = await createSiswa(req);

        res.status(StatusCodes.CREATED).json({
            message: 'Siswa berhasil dibuat',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ALL Siswa
const index = async (req, res, next) => {
    try {
        const result = await getAllSiswa(req);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil semua data siswa',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ONE Siswa
const find = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await getSiswaDetail(idSiswa);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil detail siswa',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// UPDATE Siswa
const update = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await updateSiswa(idSiswa, req.body);

        res.status(StatusCodes.OK).json({
            message: 'Siswa berhasil diupdate',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// DELETE Siswa
const destroy = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await deleteSiswa(idSiswa);

        res.status(StatusCodes.OK).json({
            message: 'Siswa berhasil dihapus',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    index,
    find,
    update,
    destroy,
};
