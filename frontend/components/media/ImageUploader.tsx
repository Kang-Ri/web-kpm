import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { mediaService, Media, UploadOptions } from '@/lib/api/media.service';
import { showSuccess, showError } from '@/lib/utils/toast';

// =====================================================
// Types
// =====================================================

interface UploadedMedia {
    idMedia: number;
    fileUrl: string;
    fileName: string;
    uploading?: boolean;
    progress?: number;
    error?: string;
}

interface ImageUploaderProps {
    entityType: string;               // 'product', 'parent1', 'parent2', etc
    maxFiles?: number;                // Max number of files (default: 5)
    category?: string;                // 'gallery', 'thumbnail', etc
    onUploadComplete?: (media: UploadedMedia[]) => void;
    existingMedia?: Media[];          // For edit mode
    className?: string;
}

// =====================================================
// ImageUploader Component
// =====================================================

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    entityType,
    maxFiles = 5,
    category = 'gallery',
    onUploadComplete,
    existingMedia = [],
    className = ''
}) => {
    const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // =====================================================
    // File Upload Handler - INSTANT UPLOAD
    // =====================================================

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);

        // Check max files limit
        if (uploadedMedia.length + filesArray.length > maxFiles) {
            showError(`Maksimal ${maxFiles} gambar`);
            return;
        }

        // Upload each file instantly
        for (const file of filesArray) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError(`File ${file.name} bukan gambar`);
                continue;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError(`File ${file.name} terlalu besar (max 5MB)`);
                continue;
            }

            // Add to list with uploading state
            const tempMedia: UploadedMedia = {
                idMedia: Date.now() + Math.random(), // Temporary ID
                fileUrl: URL.createObjectURL(file),
                fileName: file.name,
                uploading: true,
                progress: 0
            };

            setUploadedMedia(prev => [...prev, tempMedia]);

            // Upload instantly
            try {
                const uploadOptions: UploadOptions = {
                    category,
                    isPrimary: uploadedMedia.length === 0 && existingMedia.length === 0, // First image = primary
                    altText: file.name
                };

                const response = await mediaService.uploadInstant(file, entityType, uploadOptions);

                // Construct full URL for preview (backend returns relative path)
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const fullImageUrl = response.data?.fileUrl?.startsWith('http')
                    ? response.data.fileUrl
                    : `${backendUrl}/${response.data?.fileUrl}`;

                // Update with real media data
                setUploadedMedia(prev => prev.map(m =>
                    m.fileName === file.name
                        ? {
                            idMedia: response.data?.idMedia || 0,
                            fileUrl: fullImageUrl, // Use full URL for preview
                            fileName: response.data?.fileName || file.name,
                            uploading: false
                        }
                        : m
                ));

                showSuccess(`${file.name} berhasil diupload`);

            } catch (error: any) {
                console.error('Upload error:', error);

                // Mark as error
                setUploadedMedia(prev => prev.map(m =>
                    m.fileName === file.name
                        ? { ...m, uploading: false, error: 'Upload failed' }
                        : m
                ));

                showError(`Gagal upload ${file.name}`);
            }
        }
    };

    // =====================================================
    // Delete Uploaded Media
    // =====================================================

    const handleDeleteMedia = async (idMedia: number) => {
        try {
            await mediaService.deleteMedia(idMedia);
            setUploadedMedia(prev => prev.filter(m => m.idMedia !== idMedia));
            showSuccess('Gambar berhasil dihapus');
        } catch (error) {
            showError('Gagal menghapus gambar');
        }
    };

    // =====================================================
    // Drag & Drop Handlers
    // =====================================================

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    }, [uploadedMedia.length]);

    // =====================================================
    // File Input Change
    // =====================================================

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e.target.files);
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // =====================================================
    // Notify parent when upload complete
    // =====================================================

    useEffect(() => {
        const completedUploads = uploadedMedia.filter(m => !m.uploading && !m.error);
        if (completedUploads.length > 0 && onUploadComplete) {
            onUploadComplete(completedUploads);
        }
    }, [uploadedMedia, onUploadComplete]);

    // =====================================================
    // Render
    // =====================================================

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Upload Area */}
            <div
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center
                    transition-colors cursor-pointer
                    ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                    ${uploadedMedia.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => uploadedMedia.length < maxFiles && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={uploadedMedia.length >= maxFiles}
                />

                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />

                <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold text-blue-600">Klik untuk upload</span> atau drag & drop
                </p>
                <p className="text-xs text-gray-500">
                    PNG, JPG, GIF hingga 5MB (max {maxFiles} gambar)
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    {uploadedMedia.length} / {maxFiles} gambar terupload
                </p>
            </div>

            {/* Uploaded Images Grid */}
            {uploadedMedia.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedMedia.map((media) => (
                        <div key={media.idMedia} className="relative group">
                            {/* Image Preview */}
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img
                                    src={media.fileUrl.startsWith('http') ? media.fileUrl : `http://localhost:5000/${media.fileUrl}`}
                                    alt={media.fileName}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Overlay with status */}
                            {media.uploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                </div>
                            )}

                            {media.error && (
                                <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center rounded-lg">
                                    <p className="text-white text-xs">Error</p>
                                </div>
                            )}

                            {!media.uploading && !media.error && (
                                <>
                                    {/* Success badge */}
                                    <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMedia(media.idMedia)}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            )}

                            {/* Filename */}
                            <p className="text-xs text-gray-600 mt-1 truncate">
                                {media.fileName}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Info message */}
            {uploadedMedia.length === 0 && existingMedia.length === 0 && (
                <p className="text-xs text-gray-500 text-center">
                    <ImageIcon className="inline h-4 w-4 mr-1" />
                    Belum ada gambar terupload. Upload akan langsung dimulai saat Anda pilih file.
                </p>
            )}
        </div>
    );
};

// Export for parent to get uploaded IDs
export { type UploadedMedia };
