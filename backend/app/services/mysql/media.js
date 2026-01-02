const Media = require('../../api/v1/media/model');
const { BadRequestError, NotFoundError } = require('../../errors');
const fs = require('fs').promises;
const path = require('path');

/**
 * Valid entity types for polymorphic relationship
 */
const VALID_ENTITY_TYPES = [
    'user',
    'parent1',
    'parent2',
    'product',
    'event',
    'banner',
    'category'
];

/**
 * Upload media instantly (without entityId - for instant upload approach)
 * @param {Object} file - Multer file object
 * @param {string} entityType - Type of entity (user, product, etc)
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Created media record
 */
const uploadMediaInstant = async (file, entityType, options = {}) => {
    try {
        // Validate entity type
        if (!VALID_ENTITY_TYPES.includes(entityType)) {
            throw new BadRequestError(`Invalid entity type: ${entityType}`);
        }

        const {
            category = 'general',
            isPrimary = false,
            altText = '',
            caption = '',
            uploadedBy = null
        } = options;

        // Create media record with NULL entityId (orphaned state)
        const media = await Media.create({
            entityType,
            entityId: null, // Will be linked later
            fileName: file.filename,
            fileUrl: file.path.replace(/\\/g, '/'), // Normalize path
            fileSize: file.size,
            mimeType: file.mimetype,
            mediaType: file.mimetype.startsWith('image/') ? 'image' : 'document',
            mediaCategory: category,
            isPrimary,
            altText,
            caption,
            uploadedBy,
        });

        console.log(`✅ Media uploaded instantly: ${media.idMedia} (orphaned)`);

        // Access fields directly from Sequelize instance (uses getters/field mapping)
        // NOT from dataValues (which has raw DB column names)
        const response = {
            idMedia: media.idMedia,
            entityType: media.entityType,
            entityId: media.entityId,
            fileName: media.fileName,      // Uses Sequelize getter - maps from 'filename' column
            fileUrl: media.fileUrl,        // Uses Sequelize getter - maps from 'fileUrl1' column
            fileSize: media.fileSize,
            mimeType: media.mimeType,
            mediaType: media.mediaType,
            mediaCategory: media.mediaCategory,
            orderIndex: media.orderIndex,
            isPrimary: media.isPrimary,
            altText: media.altText,
            caption: media.caption,
            uploadedBy: media.uploadedBy,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt
        };

        console.log('🔍 DEBUG Response Object:', JSON.stringify(response, null, 2));
        return response;

    } catch (error) {
        console.error('❌ Upload media instant error:', error);
        throw error;
    }
};

/**
 * Link orphaned media to entity
 * @param {number} idMedia - Media ID
 * @param {number} entityId - Entity ID to link to
 * @returns {Promise<Object>} Updated media record
 */
const linkMediaToEntity = async (idMedia, entityId) => {
    try {
        const media = await Media.findByPk(idMedia);

        if (!media) {
            throw new NotFoundError('Media not found');
        }

        if (media.entityId !== null) {
            throw new BadRequestError('Media already linked to an entity');
        }

        // Update entityId
        media.entityId = entityId;
        await media.save();

        console.log(`🔗 Media ${idMedia} linked to ${media.entityType} ${entityId}`);
        return media;

    } catch (error) {
        console.error('❌ Link media error:', error);
        throw error;
    }
};

/**
 * Get all media for specific entity
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Array of media records
 */
const getMediaByEntity = async (entityType, entityId, category = null) => {
    try {
        const whereClause = {
            entityType,
            entityId
        };

        if (category) {
            whereClause.mediaCategory = category;
        }

        const mediaList = await Media.findAll({
            where: whereClause,
            order: [['orderIndex', 'ASC'], ['createdAt', 'ASC']]
        });

        return mediaList;

    } catch (error) {
        console.error('❌ Get media by entity error:', error);
        throw error;
    }
};

/**
 * Get primary media for entity
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @returns {Promise<Object|null>} Primary media or null
 */
const getPrimaryMedia = async (entityType, entityId) => {
    try {
        const media = await Media.findOne({
            where: {
                entityType,
                entityId,
                isPrimary: true
            }
        });

        return media;

    } catch (error) {
        console.error('❌ Get primary media error:', error);
        throw error;
    }
};

/**
 * Delete media (file + record)
 * @param {number} idMedia - Media ID
 * @returns {Promise<boolean>} Success status
 */
const deleteMedia = async (idMedia) => {
    try {
        const media = await Media.findByPk(idMedia);

        if (!media) {
            throw new NotFoundError('Media not found');
        }

        // Delete physical file
        try {
            const filePath = path.join(__dirname, '../../../', media.fileUrl);
            await fs.unlink(filePath);
            console.log(`🗑️ File deleted: ${filePath}`);
        } catch (fileError) {
            console.warn('⚠️ Could not delete file:', fileError.message);
            // Continue even if file delete fails
        }

        // Delete database record
        await media.destroy();
        console.log(`✅ Media ${idMedia} deleted`);

        return true;

    } catch (error) {
        console.error('❌ Delete media error:', error);
        throw error;
    }
};

/**
 * Set media as primary (unset others)
 * @param {number} idMedia - Media ID to set as primary
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @returns {Promise<Object>} Updated media
 */
const setAsPrimary = async (idMedia, entityType, entityId) => {
    try {
        // Unset all primary flags for this entity
        await Media.update(
            { isPrimary: false },
            {
                where: {
                    entityType,
                    entityId,
                    isPrimary: true
                }
            }
        );

        // Set this media as primary
        const media = await Media.findByPk(idMedia);

        if (!media) {
            throw new NotFoundError('Media not found');
        }

        media.isPrimary = true;
        await media.save();

        console.log(`⭐ Media ${idMedia} set as primary`);
        return media;

    } catch (error) {
        console.error('❌ Set as primary error:', error);
        throw error;
    }
};

/**
 * Update media metadata
 * @param {number} idMedia - Media ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated media
 */
const updateMedia = async (idMedia, data) => {
    try {
        const media = await Media.findByPk(idMedia);

        if (!media) {
            throw new NotFoundError('Media not found');
        }

        const allowedFields = ['altText', 'caption', 'mediaCategory', 'orderIndex'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                media[field] = data[field];
            }
        });

        await media.save();
        console.log(`✅ Media ${idMedia} updated`);

        return media;

    } catch (error) {
        console.error('❌ Update media error:', error);
        throw error;
    }
};

/**
 * Cleanup orphaned media older than 24 hours
 * @returns {Promise<number>} Number of cleaned up records
 */
const cleanupOrphanedMedia = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const orphanedMedia = await Media.findAll({
            where: {
                entityId: null,
                createdAt: {
                    [require('sequelize').Op.lt]: twentyFourHoursAgo
                }
            }
        });

        let cleanedCount = 0;

        for (const media of orphanedMedia) {
            await deleteMedia(media.idMedia);
            cleanedCount++;
        }

        console.log(`🧹 Cleaned up ${cleanedCount} orphaned media files`);
        return cleanedCount;

    } catch (error) {
        console.error('❌ Cleanup orphaned media error:', error);
        throw error;
    }
};

module.exports = {
    uploadMediaInstant,
    linkMediaToEntity,
    getMediaByEntity,
    getPrimaryMedia,
    deleteMedia,
    setAsPrimary,
    updateMedia,
    cleanupOrphanedMedia,
    VALID_ENTITY_TYPES,
};
