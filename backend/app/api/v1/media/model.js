const { DataTypes } = require('sequelize');
const sequelize = require('../../../db/sequelizeConfig');

const Media = sequelize.define('Media', {
    idMedia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },

    // Polymorphic relationship
    entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Entity type: user, parent1, parent2, product, event, etc',
        validate: {
            isIn: {
                args: [['user', 'parent1', 'parent2', 'product', 'event', 'banner', 'category']],
                msg: 'Invalid entity type'
            }
        }
    },

    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable for instant upload (orphaned state)
        comment: 'ID of the entity (can be NULL during instant upload)',
    },

    // File information
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },

    fileUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Relative path or full URL to the file',
    },

    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'File size in bytes',
    },

    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'MIME type: image/jpeg, image/png, etc',
    },

    // Media classification
    mediaType: {
        type: DataTypes.ENUM('image', 'video', 'document', 'audio'),
        defaultValue: 'image',
    },

    mediaCategory: {
        type: DataTypes.STRING(50),
        defaultValue: 'general',
        comment: 'Category: profile, thumbnail, gallery, banner, icon, etc',
    },

    // Ordering and primary flag
    orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Order for sorting (lower number = first)',
    },

    isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Is this the primary/featured image for the entity?',
    },

    // Metadata
    altText: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Alt text for SEO and accessibility',
    },

    caption: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Caption or description',
    },

    // Audit fields
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID who uploaded this media',
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },

    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
    tableName: 'media',
    indexes: [
        {
            name: 'idx_entity',
            fields: ['entityType', 'entityId']
        },
        {
            name: 'idx_entity_primary',
            fields: ['entityType', 'entityId', 'isPrimary']
        },
        {
            name: 'idx_media_type',
            fields: ['mediaType']
        },
        {
            name: 'idx_uploaded_by',
            fields: ['uploadedBy']
        },
        {
            name: 'idx_orphaned',
            fields: ['entityId', 'createdAt']
        }
    ],
    hooks: {
        // Before destroy, we can cleanup the actual file
        beforeDestroy: async (media, options) => {
            // File cleanup will be handled in service layer
            console.log(`🗑️ Preparing to delete media: ${media.fileName}`);
        }
    }
});

// Virtual getter for full URL
Media.prototype.getFullUrl = function () {
    if (this.fileUrl.startsWith('http')) {
        return this.fileUrl;
    }
    // For local files, prepend base URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/${this.fileUrl}`;
};

module.exports = Media;
