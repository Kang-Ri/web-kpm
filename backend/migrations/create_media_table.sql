-- =====================================================
-- Universal Media Table Migration
-- Purpose: Store all media (images, videos, docs) for any entity
-- =====================================================

CREATE TABLE media (
    idMedia INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Polymorphic Relationship (link to any entity)
    entityType VARCHAR(50) NOT NULL COMMENT "Entity type: user, parent1, parent2, product, etc",
    entityId INT COMMENT "ID of the entity",
    
    -- File Information
    fileName VARCHAR(255) NOT NULL COMMENT "Original or processed filename",
    fileUrl VARCHAR(500) NOT NULL COMMENT "URL or path to the file",
    fileSize INT COMMENT "File size in bytes",
    mimeType VARCHAR(100) COMMENT "MIME type: image/jpeg, image/png, etc",
    
    -- Media Classification
    mediaType ENUM('image', 'video', 'document', 'audio') DEFAULT 'image',
    mediaCategory VARCHAR(50) DEFAULT 'general' COMMENT "Category: profile, thumbnail, gallery, banner, icon, etc",
    
    -- Ordering and Primary Flag
    orderIndex INT DEFAULT 0 COMMENT "Order for sorting (lower = first)",
    isPrimary BOOLEAN DEFAULT FALSE COMMENT "Primary/featured image for the entity",
    
    -- Metadata
    altText VARCHAR(255) COMMENT "Alt text for SEO and accessibility",
    caption TEXT COMMENT "Caption or description",
    
    -- Audit Fields
    uploadedBy INT COMMENT "User ID who uploaded this media",
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for Performance
    INDEX idx_entity (entityType, entityId),
    INDEX idx_entity_primary (entityType, entityId, isPrimary),
    INDEX idx_media_type (mediaType),
    INDEX idx_uploaded_by (uploadedBy)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT="Universal media storage for all entities (polymorphic)";

-- =====================================================
-- Entity Types Reference
-- =====================================================
-- 'user'       : User profile photos, cover images
-- 'parent1'    : Category/Kelas images (thumbnail, banner)
-- 'parent2'    : Ruang Kelas images (thumbnail, banner)
-- 'product'    : Product/Materi images (thumbnail, gallery)
-- 'event'      : Event images (future)
-- 'banner'     : Homepage banners (future)
-- 'category'   : Category icons (future)

-- =====================================================
-- Media Categories Reference
-- =====================================================
-- 'profile'    : Profile photo
-- 'cover'      : Cover/banner image
-- 'thumbnail'  : Thumbnail/preview image
-- 'gallery'    : Gallery images
-- 'banner'     : Banner images
-- 'icon'       : Icon/logo images
-- 'attachment' : File attachments

-- =====================================================
-- Example Queries
-- =====================================================

-- Get all images for a product
-- SELECT * FROM media WHERE entityType = 'product' AND entityId = 25 ORDER BY orderIndex;

-- Get primary image for user
-- SELECT * FROM media WHERE entityType = 'user' AND entityId = 123 AND isPrimary = TRUE LIMIT 1;

-- Get all profile photos
-- SELECT * FROM media WHERE mediaCategory = 'profile';

-- Delete all media for deleted entity
-- DELETE FROM media WHERE entityType = 'product' AND entityId = 999;
