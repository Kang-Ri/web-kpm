const VariableTemplate = require('../../api/v1/variableTemplates/model');
const { NotFoundError, BadRequestError } = require('../../errors');

/**
 * Get all variable templates
 */
const getAllTemplates = async () => {
    const templates = await VariableTemplate.findAll({
        order: [['orderIndex', 'ASC'], ['createdAt', 'ASC']]
    });
    return templates;
};

/**
 * Get one template by ID
 */
const getTemplateById = async (idTemplate) => {
    const template = await VariableTemplate.findByPk(idTemplate);

    if (!template) {
        throw new NotFoundError('Template tidak ditemukan');
    }

    return template;
};

/**
 * Create new template
 */
const createTemplate = async (data) => {
    const { namaVariable, label, description, category, color, orderIndex } = data;

    // Check if namaVariable already exists
    const existing = await VariableTemplate.findOne({ where: { namaVariable } });
    if (existing) {
        throw new BadRequestError(`Variable "${namaVariable}" sudah ada`);
    }

    const template = await VariableTemplate.create({
        namaVariable,
        label,
        description,
        category,
        color: color || '#6B7280',
        orderIndex: orderIndex ?? 0
    });

    return template;
};

/**
 * Update template
 */
const updateTemplate = async (idTemplate, data) => {
    const template = await getTemplateById(idTemplate);

    const { namaVariable, label, description, category, color, orderIndex } = data;

    // Check unique namaVariable if changed
    if (namaVariable && namaVariable !== template.namaVariable) {
        const existing = await VariableTemplate.findOne({ where: { namaVariable } });
        if (existing) {
            throw new BadRequestError(`Variable "${namaVariable}" sudah ada`);
        }
    }

    await template.update({
        namaVariable: namaVariable || template.namaVariable,
        label: label || template.label,
        description: description !== undefined ? description : template.description,
        category: category || template.category,
        color: color || template.color,
        orderIndex: orderIndex !== undefined ? orderIndex : template.orderIndex
    });

    return template;
};

/**
 * Delete template
 */
const deleteTemplate = async (idTemplate) => {
    const template = await getTemplateById(idTemplate);
    await template.destroy();
    return { message: 'Template berhasil dihapus' };
};

/**
 * Reorder templates
 */
const reorderTemplates = async (templates) => {
    // templates = [{ idTemplate, orderIndex }, ...]
    for (const item of templates) {
        await VariableTemplate.update(
            { orderIndex: item.orderIndex },
            { where: { idTemplate: item.idTemplate } }
        );
    }

    return { message: 'Urutan template berhasil diubah' };
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates
};
