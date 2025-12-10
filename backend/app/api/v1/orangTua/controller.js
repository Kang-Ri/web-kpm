const { StatusCodes } = require('http-status-codes');
const {
    createOrangTua,
    getOrangTuaBySiswa,
    updateOrangTua,
    deleteOrangTua,
} = require('../../../services/mysql/orangTua');

// CREATE OrangTua
const create = async (req, res, next) => {
    try {
        const result = await createOrangTua(req);

        res.status(StatusCodes.CREATED).json({
            message: 'Data orang tua berhasil dibuat',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET OrangTua by Siswa
const findBySiswa = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await getOrangTuaBySiswa(idSiswa);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil data orang tua',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// UPDATE OrangTua
const update = async (req, res, next) => {
    try {
        const { idOrangTua } = req.params;
        const result = await updateOrangTua(idOrangTua, req.body);

        res.status(StatusCodes.OK).json({
            message: 'Data orang tua berhasil diupdate',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// DELETE OrangTua
const destroy = async (req, res, next) => {
    try {
        const { idOrangTua } = req.params;
        const result = await deleteOrangTua(idOrangTua);

        res.status(StatusCodes.OK).json({
            message: 'Data orang tua berhasil dihapus',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    findBySiswa,
    update,
    destroy,
};
