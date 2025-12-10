const { StatusCodes } = require('http-status-codes');
const {
    enrollSiswa,
    getAllEnrollments,
    getEnrollmentDetail,
    updateEnrollmentStatus,
    deleteEnrollment,
} = require('../../../services/mysql/siswaKelas');

// ENROLL Siswa
const create = async (req, res, next) => {
    try {
        const result = await enrollSiswa(req);

        res.status(StatusCodes.CREATED).json({
            message: 'Siswa berhasil didaftarkan ke kelas',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ALL Enrollments
const index = async (req, res, next) => {
    try {
        const result = await getAllEnrollments(req);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil semua data enrollment',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET ONE Enrollment
const find = async (req, res, next) => {
    try {
        const { idSiswaKelas } = req.params;
        const result = await getEnrollmentDetail(idSiswaKelas);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil detail enrollment',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// UPDATE Enrollment Status
const update = async (req, res, next) => {
    try {
        const { idSiswaKelas } = req.params;
        const result = await updateEnrollmentStatus(idSiswaKelas, req.body);

        res.status(StatusCodes.OK).json({
            message: 'Status enrollment berhasil diupdate',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// DELETE Enrollment
const destroy = async (req, res, next) => {
    try {
        const { idSiswaKelas } = req.params;
        const result = await deleteEnrollment(idSiswaKelas);

        res.status(StatusCodes.OK).json({
            message: 'Enrollment berhasil dihapus',
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
