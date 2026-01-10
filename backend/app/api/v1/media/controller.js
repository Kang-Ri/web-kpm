const { StatusCodes } = require('http-status-codes');
const MediaService = require('../../../services/mysql/media');

/**
 * POST /api/v1/cms/media/instant-upload
 * Upload media instantly (without entityId)
 */
const instantUpload = async (req, res, next) => {
    try {
        const { entityType, category, isPrimary, altText, caption } = req.body;
        const uploadedBy = req.user?.userId || null;

        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'No file uploaded'
            });
        }

        const media = await MediaService.uploadMediaInstant(
            req.file,
            entityType,
            {
                category,
                isPrimary: isPrimary === 'true' || isPrimary === true,
                altText,
                caption,
                uploadedBy
            }
        );

        res.status(StatusCodes.CREATED).json({
            message: 'Media uploaded successfully',
            data: media
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/cms/media/:idMedia/link
 * Link orphaned media to entity
 */
const linkToEntity = async (req, res, next) => {
    try {
        const { idMedia } = req.params;
        const { entityId } = req.body;

        if (!entityId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'entityId is required'
            });
        }

        const media = await MediaService.linkMediaToEntity(
            parseInt(idMedia),
            parseInt(entityId)
        );

        res.status(StatusCodes.OK).json({
            message: 'Media linked to entity successfully',
            data: media
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/cms/media/:entityType/:entityId
 * Get all media for an entity
 */
const getMediaByEntity = async (req, res, next) => {
    try {
        const { entityType, entityId } = req.params;
        const { category } = req.query;

        const mediaList = await MediaService.getMediaByEntity(
            entityType,
            parseInt(entityId),
            category
        );

        res.status(StatusCodes.OK).json({
            message: 'Media retrieved successfully',
            data: mediaList
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/cms/media/:entityType/:entityId/primary
 * Get primary media for an entity
 */
const getPrimaryMedia = async (req, res, next) => {
    try {
        const { entityType, entityId } = req.params;

        const media = await MediaService.getPrimaryMedia(
            entityType,
            parseInt(entityId)
        );

        // Return null data instead of 404 for graceful frontend handling
        res.status(StatusCodes.OK).json({
            message: media ? 'Primary media retrieved successfully' : 'No primary media found',
            data: media || null
        });

    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/cms/media/:idMedia
 * Delete media (file + record)
 */
const deleteMedia = async (req, res, next) => {
    try {
        const { idMedia } = req.params;

        await MediaService.deleteMedia(parseInt(idMedia));

        res.status(StatusCodes.OK).json({
            message: 'Media deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/cms/media/:idMedia/set-primary
 * Set media as primary
 */
const setAsPrimary = async (req, res, next) => {
    try {
        const { idMedia } = req.params;
        const { entityType, entityId } = req.body;

        if (!entityType || !entityId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'entityType and entityId are required'
            });
        }

        const media = await MediaService.setAsPrimary(
            parseInt(idMedia),
            entityType,
            parseInt(entityId)
        );

        res.status(StatusCodes.OK).json({
            message: 'Media set as primary successfully',
            data: media
        });

    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/cms/media/:idMedia
 * Update media metadata
 */
const updateMedia = async (req, res, next) => {
    try {
        const { idMedia } = req.params;
        const { altText, caption, mediaCategory, orderIndex } = req.body;

        const media = await MediaService.updateMedia(
            parseInt(idMedia),
            { altText, caption, mediaCategory, orderIndex }
        );

        res.status(StatusCodes.OK).json({
            message: 'Media updated successfully',
            data: media
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    instantUpload,
    linkToEntity,
    getMediaByEntity,
    getPrimaryMedia,
    deleteMedia,
    setAsPrimary,
    updateMedia,
};
