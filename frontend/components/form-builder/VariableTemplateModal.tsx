'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { variableTemplateService, VariableTemplate } from '@/lib/api/variableTemplate.service';
import { showSuccess, showError } from '@/lib/utils/toast';

interface VariableTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const CATEGORY_OPTIONS = [
    { value: 'personal', label: 'Personal', color: '#3B82F6' },
    { value: 'academic', label: 'Academic', color: '#F59E0B' },
    { value: 'contact', label: 'Contact', color: '#10B981' },
    { value: 'other', label: 'Other', color: '#6B7280' },
];

const DEFAULT_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EF4444', '#EC4899', '#14B8A6', '#6B7280'
];

export function VariableTemplateModal({ isOpen, onClose, onUpdate }: VariableTemplateModalProps) {
    const [templates, setTemplates] = useState<VariableTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        namaVariable: '',
        label: '',
        description: '',
        category: 'other' as 'personal' | 'academic' | 'contact' | 'other',
        color: '#6B7280',
        orderIndex: 0
    });

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await variableTemplateService.getAll();
            const data = (response.data as any).data || response.data;
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error: any) {
            showError(error.message || 'Gagal memuat templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingId) {
                await variableTemplateService.update(editingId, formData);
                showSuccess('Template berhasil diupdate');
            } else {
                await variableTemplateService.create({
                    ...formData,
                    orderIndex: templates.length
                });
                showSuccess('Template berhasil ditambahkan');
            }

            resetForm();
            loadTemplates();
            onUpdate?.();
        } catch (error: any) {
            showError(error.message || 'Gagal menyimpan template');
        }
    };

    const handleEdit = (template: VariableTemplate) => {
        setEditingId(template.idTemplate);
        setFormData({
            namaVariable: template.namaVariable,
            label: template.label,
            description: template.description || '',
            category: template.category,
            color: template.color,
            orderIndex: template.orderIndex
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus template ini?')) return;

        try {
            await variableTemplateService.delete(id);
            showSuccess('Template berhasil dihapus');
            loadTemplates();
            onUpdate?.();
        } catch (error: any) {
            showError(error.message || 'Gagal menghapus template');
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newTemplates = [...templates];
        [newTemplates[index], newTemplates[index - 1]] = [newTemplates[index - 1], newTemplates[index]];

        await updateOrder(newTemplates);
    };

    const handleMoveDown = async (index: number) => {
        if (index === templates.length - 1) return;
        const newTemplates = [...templates];
        [newTemplates[index], newTemplates[index + 1]] = [newTemplates[index + 1], newTemplates[index]];

        await updateOrder(newTemplates);
    };

    const updateOrder = async (newTemplates: VariableTemplate[]) => {
        try {
            const updates = newTemplates.map((t, idx) => ({
                idTemplate: t.idTemplate,
                orderIndex: idx
            }));

            await variableTemplateService.reorder(updates);
            setTemplates(newTemplates);
            onUpdate?.();
        } catch (error: any) {
            showError(error.message || 'Gagal mengubah urutan');
            loadTemplates(); // Reload on error
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setShowForm(false);
        setFormData({
            namaVariable: '',
            label: '',
            description: '',
            category: 'other',
            color: '#6B7280',
            orderIndex: 0
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Kelola Variable Templates</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Add/Edit Form */}
                    {showForm ? (
                        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                            <h3 className="font-semibold text-gray-900">
                                {editingId ? 'Edit Template' : 'Tambah Template Baru'}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Variable <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.namaVariable}
                                        onChange={(e) => setFormData({ ...formData, namaVariable: e.target.value })}
                                        placeholder="nama_lengkap"
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Label <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="Nama Lengkap"
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                        className="input"
                                    >
                                        {CATEGORY_OPTIONS.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Color
                                    </label>
                                    <div className="flex gap-2">
                                        {DEFAULT_COLORS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-8 h-8 rounded border-2 ${formData.color === color ? 'border-blue-600' : 'border-gray-300'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description..."
                                    className="input"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" variant="primary">
                                    {editingId ? 'Update' : 'Tambah'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={resetForm}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Button
                            onClick={() => setShowForm(true)}
                            variant="primary"
                            icon={Plus}
                            className="mb-6"
                        >
                            Tambah Template Baru
                        </Button>
                    )}

                    {/* Templates List */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada template. Tambahkan template pertama!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {templates.map((template, index) => (
                                <div
                                    key={template.idTemplate}
                                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300"
                                >
                                    {/* Drag handle */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === templates.length - 1}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            ▼
                                        </button>
                                    </div>

                                    {/* Color indicator */}
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: template.color }}
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900">{template.label}</div>
                                        <div className="text-sm text-gray-500">{template.namaVariable}</div>
                                    </div>

                                    {/* Category badge */}
                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                        {template.category}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.idTemplate)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <Button onClick={onClose} variant="secondary" className="w-full">
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}
