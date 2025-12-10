// app/api/v1/formFields/controller.js
const { StatusCodes } = require('http-status-codes');
const {
    addFieldToForm,
    getFieldsByForm,
    updateField,
    deleteField,
} = require('../../../services/mysql/formFields');


const create = async (req, res, next) => {
    try {
        const { idForm } = req.params;
        const result = await addFieldToForm(idForm, req.body);

        res.status(StatusCodes.CREATED).json({
            message: 'Field berhasil ditambahkan.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
const index = async (req, res, next) => {
    try {
        const { idForm } = req.params;
        const result = await getFieldsByForm(idForm);

        res.status(StatusCodes.OK).json({
            message: 'Data fields berhasil diambil.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
const update = async (req, res, next) => {
    try {
        const { idField } = req.params;
        const result = await updateField(idField, req.body);

        res.status(StatusCodes.OK).json({
            message: 'Field berhasil diperbarui.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
const destroy = async (req, res, next) => {
    try {
        const { idField } = req.params;
        await deleteField(idField);

        res.status(StatusCodes.OK).json({
            message: 'Field berhasil dihapus.',
        });
    } catch (error) {
        next(error);
    }
};
module.exports = { create, index, update, destroy };