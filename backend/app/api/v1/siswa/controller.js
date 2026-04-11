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
    getParent1Sections,
    getEnrollmentDashboard,
    getParent2ForEnrollment,
    completeProfile,
    enrollToKelas,
    getMyClasses,
    getClassroomContent,
    createMateriOrder,
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

// === ENROLLMENT CONTROLLERS ===

// Get Parent1 Sections (No Filter) - Public dashboard
const listParent1Sections = async (req, res, next) => {
    try {
        const sections = await getParent1Sections();

        res.status(StatusCodes.OK).json({
            message: 'Parent1 sections retrieved successfully',
            data: sections,
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

// ENROLL TO KELAS
const enroll = async (req, res, next) => {
    try {
        const { idSiswa, idParent2 } = req.body;

        if (!idSiswa || !idParent2) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'idSiswa dan idParent2 wajib diisi'
            });
        }

        const result = await enrollToKelas(parseInt(idSiswa), parseInt(idParent2));

        res.status(StatusCodes.CREATED).json({
            message: result.message,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET FORM FOR PARENT2 (Ruang Kelas)
const getFormForParent2 = async (req, res, next) => {
    try {
        const { idParent2 } = req.params;
        const ParentProduct2 = require('../../../api/v1/parentProduct2/model');
        const Form = require('../../../api/v1/forms/model');
        const FormField = require('../../../api/v1/formFields/model');

        const parent2 = await ParentProduct2.findByPk(idParent2, {
            attributes: ['idParent2', 'namaParent2', 'idFormDaftarUlang']
        });

        if (!parent2) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: `Ruang kelas dengan ID ${idParent2} tidak ditemukan.`
            });
        }

        if (!parent2.idFormDaftarUlang) {
            return res.status(StatusCodes.OK).json({
                message: 'Tidak ada form untuk ruang kelas ini',
                data: { hasForm: false, form: null }
            });
        }

        const form = await Form.findByPk(parent2.idFormDaftarUlang, {
            attributes: ['idForm', 'namaForm', 'descForm', 'statusForm'],
            include: [{
                model: FormField,
                as: 'fields',
                attributes: ['idField', 'namaField', 'tipeField', 'nilaiPilihan', 'required',
                    'textDescription', 'textWarning', 'placeholder', 'orderIndex'],
                order: [['orderIndex', 'ASC']]
            }]
        });

        if (!form) {
            return res.status(StatusCodes.OK).json({
                message: 'Form tidak ditemukan',
                data: { hasForm: false, form: null }
            });
        }

        return res.status(StatusCodes.OK).json({
            message: 'Form daftar ulang berhasil diambil',
            data: { hasForm: true, form }
        });
    } catch (err) {
        next(err);
    }
};

// GET MY ACTIVE CLASSES
const getMyActiveClasses = async (req, res, next) => {
    try {
        const { idSiswa } = req.params;
        const result = await getMyClasses(parseInt(idSiswa));

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil daftar kelas aktif Anda',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// GET CLASSROOM MATERIALS (CONTENT)
const getClassroomMaterials = async (req, res, next) => {
    try {
        const { idSiswa, idParent2 } = req.params;
        const result = await getClassroomContent(parseInt(idSiswa), parseInt(idParent2));

        res.status(StatusCodes.OK).json({
            message: 'Berhasil mengambil materi ruang kelas',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// BUY SPECIFIC MATERIAL (PRODUCT)
const buyMateri = async (req, res, next) => {
    try {
        const { idSiswa, idProduk } = req.body;

        if (!idSiswa || !idProduk) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'idSiswa dan idProduk wajib diisi'
            });
        }

        const result = await createMateriOrder(parseInt(idSiswa), parseInt(idProduk));

        res.status(StatusCodes.OK).json({
            message: result.message || 'Proses pembelian materi berhasil dimulai',
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
    listParent1Sections,
    enrollmentDashboard,
    parent2List,
    finishProfile,
    enroll,
    getFormForParent2,
    getMyActiveClasses,
    getClassroomMaterials,
    buyMateri,
};
