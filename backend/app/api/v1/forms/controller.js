const { StatusCodes } = require("http-status-codes");
const FormService = require('../../../services/mysql/forms');
// const Response = require('../../utils/response'); // Asumsi utilitas Response sudah ada

/**
 * GET /api/v1/forms - Mengambil semua Form.
 */
const getAllForms = async (req, res, next) => {
    try {
        const result = await FormService.getAllForms();
        res.status(StatusCodes.OK).json({
            message: "Data Formulir berhasil diambil.",
            data: result,
        });
    } catch (error) {
        // Meneruskan error ke middleware error handler
        next(error);
    }
};

/**
 * POST /api/v1/forms - Membuat Form baru.
 */
const create = async (req, res, next) => {
    try {
        // Service akan membaca: namaForm, deskripsi, status dari req.body
        const result = await FormService.createForm(req);

        res.status(StatusCodes.CREATED).json({
            message: "Formulir berhasil dibuat.",
            data: result,
        });
    } catch (error) {
        // Error duplikasi/input tidak valid akan ditangkap dan diteruskan
        next(error);
    }
};

/**
 * GET /api/v1/forms/:idForm - Mengambil detail Form.
 */
const getFormDetail = async (req, res, next) => {
    const { idForm } = req.params;
    try {
        // Meneruskan ID ke service
        const result = await FormService.getFormDetail(idForm);

        res.status(StatusCodes.OK).json({
            message: "Detail Formulir berhasil diambil.",
            data: result,
        });
    } catch (error) {
        // Error NotFoundError akan ditangkap dan diteruskan
        next(error);
    }
};

/**
 * PUT /api/v1/forms/:idForm - Memperbarui Form.
 */
const update = async (req, res, next) => {
    const { idForm } = req.params;

    try {
        // Meneruskan id dan body ke service
        const updatedForm = await FormService.updateForm(idForm, req.body);

        res.status(StatusCodes.OK).json({
            message: "Formulir berhasil diperbarui.",
            data: updatedForm,
        });
    } catch (error) {
        // Error NotFoundError/BadRequestError akan ditangkap dan diteruskan
        next(error);
    }
};

/**
 * DELETE /api/v1/forms/:idForm - Menghapus Form.
 */
const destroy = async (req, res, next) => {
    const { idForm } = req.params;

    try {
        const deletedForm = await FormService.deleteForm(idForm);

        res.status(StatusCodes.OK).json({
            message: "Formulir berhasil dihapus.",
            data: deletedForm,
        });
    } catch (error) {
        // Error NotFoundError/Error FK akan ditangkap dan diteruskan
        next(error);
    }
};

/**
 * POST /api/v1/cms/forms/:idForm/submit - Submit form dan buat Order
 */
const submitForm = async (req, res, next) => {
    const { idForm } = req.params;

    try {
        // Get idSiswa from Siswa table using idUser from JWT
        const Siswa = require('../siswa/model');
        const siswa = await Siswa.findOne({ where: { idUser: req.user.idUser } });
        const idSiswa = siswa?.idSiswa;
        const { responses, idSiswaKelas } = req.body; // Add idSiswaKelas

        if (!idSiswa) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "idSiswa diperlukan"
            });
        }

        if (!responses || typeof responses !== 'object') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Responses harus berupa object"
            });
        }

        const result = await FormService.submitForm(idForm, idSiswa, responses, idSiswaKelas);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Form berhasil disubmit",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/cms/forms/:idForm/duplicate - Duplicate form
 */
const duplicate = async (req, res, next) => {
    const { idForm } = req.params;
    const { newName } = req.body;

    try {
        const duplicatedForm = await FormService.duplicateForm(idForm, newName);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Form berhasil diduplikasi.",
            data: duplicatedForm
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllForms,
    create,
    getFormDetail,
    update,
    destroy,
    submitForm,
    duplicate,
};