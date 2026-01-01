import apiClient from './client';

// =====================================================
// TypeScript Interfaces
// =====================================================

export interface Media {
    idMedia: number;
    entityType: string;
    entityId: number | null;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    mediaType: 'image' | 'video' | 'document' | 'audio';
    mediaCategory: string;
    orderIndex: number;
    isPrimary: boolean;
    altText?: string;
    caption?: string;
    uploadedBy?: number;
    createdAt: string;
    updatedAt: string;
}

export interface UploadOptions {
    category?: string;
    isPrimary?: boolean;
    altText?: string;
    caption?: string;
}

export interface LinkOptions {
    entityId: number;
}

export interface UpdateMediaOptions {
    altText?: string;
    caption?: string;
    mediaCategory?: string;
    orderIndex?: number;
}

// =====================================================
// Media Service
// =====================================================

export const mediaService = {
    /**
     * Upload media instantly (without entityId)
     * For instant upload approach - file uploads immediately when selected
     */
    uploadInstant: async (
        file: File,
        entityType: string,
        options: UploadOptions = {}
    ): Promise<{ data: Media }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);

        if (options.category) formData.append('category', options.category);
        if (options.isPrimary !== undefined) formData.append('isPrimary', String(options.isPrimary));
        if (options.altText) formData.append('altText', options.altText);
        if (options.caption) formData.append('caption', options.caption);

        return apiClient.post('/cms/media/instant-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Link orphaned media to entity
     * Called on form submit after entity is created/updated
     */
    linkToEntity: async (
        idMedia: number,
        entityId: number
    ): Promise<{ data: Media }> => {
        return apiClient.patch(`/cms/media/${idMedia}/link`, { entityId });
    },

    /**
     * Get all media for specific entity
     */
    getMediaByEntity: async (
        entityType: string,
        entityId: number,
        category?: string
    ): Promise<{ data: Media[] }> => {
        const params = category ? { category } : {};
        return apiClient.get(`/cms/media/${entityType}/${entityId}`, { params });
    },

    /**
     * Get primary media for entity (thumbnail/featured image)
     */
    getPrimaryMedia: async (
        entityType: string,
        entityId: number
    ): Promise<{ data: Media }> => {
        return apiClient.get(`/cms/media/${entityType}/${entityId}/primary`);
    },

    /**
     * Delete media (file + database record)
     */
    deleteMedia: async (idMedia: number): Promise<void> => {
        return apiClient.delete(`/cms/media/${idMedia}`);
    },

    /**
     * Set media as primary/featured
     */
    setAsPrimary: async (
        idMedia: number,
        entityType: string,
        entityId: number
    ): Promise<{ data: Media }> => {
        return apiClient.patch(`/cms/media/${idMedia}/set-primary`, {
            entityType,
            entityId
        });
    },

    /**
     * Update media metadata (alt text, caption, category, order)
     */
    updateMedia: async (
        idMedia: number,
        data: UpdateMediaOptions
    ): Promise<{ data: Media }> => {
        return apiClient.patch(`/cms/media/${idMedia}`, data);
    },
};
