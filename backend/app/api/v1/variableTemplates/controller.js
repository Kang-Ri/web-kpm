const { StatusCodes } = require('http-status-codes');
const TemplateService = require('../../../services/mysql/variableTemplates');

/**
 * GET /api/v1/cms/variable-templates
 */
const index = async (req, res, next) => {
    try {
        const templates = await TemplateService.getAllTemplates();
        res.status(StatusCodes.OK).json({
            success: true,
            data: templates
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/cms/variable-templates/:id
 */
const show = async (req, res, next) => {
    try {
        const { id } = req.params;
        const template = await TemplateService.getTemplateById(parseInt(id));
        res.status(StatusCodes.OK).json({
            success: true,
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/cms/variable-templates
 */
const create = async (req, res, next) => {
    try {
        const template = await TemplateService.createTemplate(req.body);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Template berhasil dibuat',
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/cms/variable-templates/:id
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const template = await TemplateService.updateTemplate(parseInt(id), req.body);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Template berhasil diupdate',
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/cms/variable-templates/:id
 */
const destroy = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await TemplateService.deleteTemplate(parseInt(id));
        res.status(StatusCodes.OK).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/cms/variable-templates/reorder
 */
const reorder = async (req, res, next) => {
    try {
        const { templates } = req.body;
        const result = await TemplateService.reorderTemplates(templates);
        res.status(StatusCodes.OK).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    index,
    show,
    create,
    update,
    destroy,
    reorder
};
