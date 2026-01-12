const { StatusCodes } = require('http-status-codes');
const {
    createSiswa,
    getAllSiswa,
    getSiswaDetail,
    updateSiswa,
    deleteSiswa,
    bulkImportSiswa,
    bulkDeleteSiswa,
    exportSiswaData,
    resetSiswaPassword,
    // Enrollment methods
    getEnrollmentDashboard,
    getParent2ForEnrollment,
    completeProfile,
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

// BULK IMPORT Siswa from Excel
const bulkImport = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'File Excel tidak ditemukan. Silakan upload file.',
            });
        }

        const result = await bulkImportSiswa(req.file);

        res.status(StatusCodes.OK).json({
            message: 'Proses bulk import selesai',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// BULK DELETE Siswa
const bulkDelete = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Array ID siswa tidak valid atau kosong.',
            });
        }

        const result = await bulkDeleteSiswa(ids);

        res.status(StatusCodes.OK).json({
            message: `Berhasil menghapus ${result.success.length} dari ${result.total} siswa`,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// EXPORT Siswa Data to Excel
const exportData = async (req, res, next) => {
    try {
        const filters = req.query; // statusAktif, etc
        const buffer = await exportSiswaData(filters);

        // Set headers untuk download file
        const filename = `Data_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);

        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

// RESET Siswa Password
const resetPassword = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await resetSiswaPassword(idSiswa);

        res.status(StatusCodes.OK).json({
            message: 'Password siswa berhasil direset ke default',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ENROLLMENT DASHBOARD
const enrollmentDashboard = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await getEnrollmentDashboard(parseInt(idSiswa));

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil data enrollment dashboard',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET PARENT2 LIST FOR ENROLLMENT
const parent2List = async (req, res, next) => {
    try {
        const { idSiswa, idParent1 } = req.params;
        const result = await getParent2ForEnrollment(
            parseInt(idSiswa),
            parseInt(idParent1)
        );

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil daftar ruang kelas',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// COMPLETE SISWA PROFILE
const finishProfile = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await completeProfile(parseInt(idSiswa), req.body);

        res.status(StatusCodes.OK).json({
            message: 'Profil berhasil dilengkapi',
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
    bulkImport,
    bulkDelete,
    exportData,
    resetPassword,
    // Enrollment controllers
    enrollmentDashboard,
    parent2List,
    finishProfile,
};
