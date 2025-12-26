const { StatusCodes } = require('http-status-codes');
const {
    enrollSiswa,
    getAllEnrollments,
    getEnrollmentDetail,
    updateEnrollmentStatus,
    deleteEnrollment,
    bulkEnrollSiswa,
    getAvailableStudents,
} = require('../../../services/mysql/siswaKelas');
const { exportSiswaKelas } = require('../../../services/mysql/siswaKelasExport');

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

// EXPORT Siswa Kelas to Excel
const exportExcel = async (req, res, next) => {
    try {
        const excelBuffer = await exportSiswaKelas(req);

        // Get ruang kelas name for filename
        const { idParent2 } = req.query;
        const ParentProduct2 = require('../../../api/v1/parentProduct2/model');
        const ruangKelas = await ParentProduct2.findOne({
            where: { idParent2 },
            attributes: ['namaParent2']
        });

        const timestamp = new Date().toISOString().split('T')[0];
        const kelasName = ruangKelas ? ruangKelas.namaParent2.replace(/\s+/g, '_') : 'Kelas';
        const filename = `Export_Siswa_${kelasName}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);
    } catch (err) {
        next(err);
    }
};

// BULK ENROLL - Enroll multiple students at once
const bulkEnroll = async (req, res, next) => {
    try {
        const result = await bulkEnrollSiswa(req);

        res.status(StatusCodes.OK).json({
            message: 'Bulk enrollment selesai',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET AVAILABLE STUDENTS - Students not yet enrolled in this class
const availableStudents = async (req, res, next) => {
    try {
        const result = await getAvailableStudents(req);

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil siswa yang tersedia',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// BULK IMPORT SISWA FROM EXCEL
const bulkImportSiswa = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new BadRequestError('File Excel wajib diupload');
        }

        const { idParent1 } = req.body;
        if (!idParent1) {
            throw new BadRequestError('idParent1 wajib diisi');
        }

        const { bulkImportSiswaFromExcel } = require('../../../services/mysql/siswaImport');
        const result = await bulkImportSiswaFromExcel(req.file.buffer, parseInt(idParent1));

        res.status(StatusCodes.OK).json({
            message: 'Bulk import siswa selesai',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// DOWNLOAD TEMPLATE EXCEL
const downloadSiswaTemplate = async (req, res, next) => {
    try {
        const { idParent1 } = req.query;

        // Get ruang kelas list for this kategori
        let ruangKelasList = [];
        if (idParent1) {
            const ParentProduct2 = require('../../../api/v1/parentProduct2/model');
            ruangKelasList = await ParentProduct2.findAll({
                where: { idParent1: parseInt(idParent1) },
                attributes: ['idParent2', 'namaParent2', 'jenjangKelasIzin']
            });
        }

        const { generateBulkSiswaTemplate } = require('../../../services/mysql/siswaImport');
        const excelBuffer = generateBulkSiswaTemplate(ruangKelasList);

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `Template_Import_Siswa_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);
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
    exportExcel,
    bulkEnroll,
    availableStudents,
    bulkImportSiswa,
    downloadSiswaTemplate,
};







