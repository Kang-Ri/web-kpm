// app/services/mysql/formFields.js
const FormField = require('../../api/v1/formFields/model');
const Form = require('../../api/v1/forms/model');
const { NotFoundError, BadRequestError } = require('../../errors');
// Validasi Form exists
const checkFormExists = async (idForm) => {
    const form = await Form.findOne({ where: { idForm } });
    if (!form) {
        throw new NotFoundError(`Form dengan ID: ${idForm} tidak ditemukan.`);
    }
    return form;
};
// Tambah field ke form
const addFieldToForm = async (idForm, fieldData) => {
    await checkFormExists(idForm);

    const {
        namaField, tipeField, nilaiPilihan, required,
        textDescription, textWarning, placeholder, orderIndex
    } = fieldData;

    // Validasi duplikasi namaField dalam form
    const checkDuplicate = await FormField.findOne({
        where: { idForm, namaField }
    });

    if (checkDuplicate) {
        throw new BadRequestError(`Field '${namaField}' sudah ada dalam form ini.`);
    }

    // Buat field
    const newField = await FormField.create({
        idForm, namaField, tipeField, nilaiPilihan,
        required, textDescription, textWarning, placeholder,
        orderIndex: orderIndex || 0
    });

    return newField;
};
// Get fields by form
const getFieldsByForm = async (idForm) => {
    await checkFormExists(idForm);

    const fields = await FormField.findAll({
        where: { idForm },
        include: [
            {
                model: Form,
                as: 'form',
                attributes: ['idForm', 'namaForm', 'descForm']
            }
        ],
        order: [['orderIndex', 'ASC']]
    });

    return fields;
};
// Update field
const updateField = async (idField, fieldData) => {
    const field = await FormField.findOne({ where: { idField } });

    if (!field) {
        throw new NotFoundError(`Field dengan ID: ${idField} tidak ditemukan.`);
    }

    // Cek duplikasi nama jika nama diubah
    if (fieldData.namaField && fieldData.namaField !== field.namaField) {
        const checkDuplicate = await FormField.findOne({
            where: {
                idForm: field.idForm,
                namaField: fieldData.namaField,
                idField: { [FormField.sequelize.Op.ne]: idField }
            },
            include: [
                {
                    model: Form,
                    as: 'form',
                    attributes: ['idForm', 'namaForm', 'descForm']
                }
            ]
        });

        if (checkDuplicate) {
            throw new BadRequestError(`Field '${fieldData.namaField}' sudah ada.`);
        }
    }

    await field.update(fieldData);
    return field;
};
// Delete field
const deleteField = async (idField) => {
    const field = await FormField.findOne({ where: { idField } });

    if (!field) {
        throw new NotFoundError(`Field dengan ID: ${idField} tidak ditemukan.`);
    }

    await field.destroy();
    return field;
};
module.exports = {
    addFieldToForm,
    getFieldsByForm,
    updateField,
    deleteField,
};