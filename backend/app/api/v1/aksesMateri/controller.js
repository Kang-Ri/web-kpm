const { StatusCodes } = require('http-status-codes');
const {
    grantAccess,
    getAllAccess,
    getAccessDetail,
    revokeAccess,
    deleteAccess,
} = require('../../../services/mysql/aksesMateri');

const {
    exportSiswaByMateri,
    getSiswaByMateri,
} = require('../../../services/mysql/aksesMateriExport');

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

// GET Siswa by Materi (for display in modal)
const getSiswaList = async (req, res, next) => {
    try {
        const { idProduk } = req.params;
        const result = await getSiswaByMateri(parseInt(idProduk));

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil data siswa',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// EXPORT Siswa by Materi to Excel
const exportSiswa = async (req, res, next) => {
    try {
        const { idProduk } = req.params;
        const buffer = await exportSiswaByMateri(parseInt(idProduk));

        if (!buffer) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Tidak ada siswa yang memiliki akses ke materi ini',
            });
        }

        const materiName = req.query.materiName || 'Materi';
        const filename = `siswa-${materiName}-${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
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
    getSiswaList,
    exportSiswa,
    revoke,
    destroy,
};
