'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { formService, formFieldService, FormField } from '@/lib/api/form.service';
import { variableTemplateService, VariableTemplate } from '@/lib/api/variableTemplate.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Button } from '@/components/ui/Button';
import { ComboBox } from '@/components/ui/ComboBox';
import { VariableTemplateModal } from '@/components/form-builder/VariableTemplateModal';

const FIELD_TYPES = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'textarea', label: 'Textarea', icon: '📄' },
    { value: 'select', label: 'Dropdown', icon: '📋' },
    { value: 'radio', label: 'Radio Buttons', icon: '⏺️' },
    { value: 'checkbox', label: 'Checkboxes', icon: '☑️' },
    { value: 'date', label: 'Date Picker', icon: '📅' },
    { value: 'file', label: 'File Upload', icon: '📎' },
];

export default function EditFormPage() {
    const router = useRouter();
    const params = useParams();
    const idForm = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form metadata
    const [namaForm, setNamaForm] = useState('');
    const [descForm, setDescForm] = useState('');
    const [statusForm, setStatusForm] = useState<'Aktif' | 'Non-Aktif' | 'Draft'>('Draft');

    // Fields
    const [fields, setFields] = useState<Partial<FormField>[]>([]);
    const [editingField, setEditingField] = useState<number | null>(null);
    const [deletedFieldIds, setDeletedFieldIds] = useState<number[]>([]);

    // Variable Templates
    const [templates, setTemplates] = useState<VariableTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    useEffect(() => {
        loadForm();
        loadTemplates();
    }, [idForm]);

    const loadTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const response = await variableTemplateService.getAll();
            const templatesData = (response.data as any).data || response.data;
            setTemplates(Array.isArray(templatesData) ? templatesData : []);
        } catch (error) {
            console.error('Failed to load templates:', error);
            setTemplates([]);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const loadForm = async () => {
        try {
            setLoading(true);
            const response = await formService.getById(idForm);
            const formData = (response.data as any).data || response.data;

            setNamaForm(formData.namaForm);
            setDescForm(formData.descForm || '');
            setStatusForm(formData.statusForm);

            // Sort fields by orderIndex to maintain order
            const sortedFields = (formData.fields || []).sort((a: any, b: any) =>
                (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );
            setFields(sortedFields);
        } catch (error: any) {
            showError(error.message || 'Gagal memuat form');
            router.push('/admin/form-builder');
        } finally {
            setLoading(false);
        }
    };

    const addField = (tipeField: string) => {
        const newField: Partial<FormField> & { tempId?: string } = {
            tempId: `temp_${Date.now()}_${Math.random()}`, // Unique temp ID for React key
            namaField: `field_${fields.length + 1}`,
            tipeField: tipeField as any,
            textDescription: '',
            placeholder: '',
            required: false,
            orderIndex: fields.length,
            nilaiPilihan: (tipeField === 'select' || tipeField === 'radio' || tipeField === 'checkbox') ? '[]' : '',
        };
        setFields([...fields, newField]);
        setEditingField(fields.length);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], ...updates };
        setFields(updated);
    };

    const deleteField = (index: number) => {
        const field = fields[index];
        if (field.idField) {
            // Existing field - mark for deletion
            setDeletedFieldIds([...deletedFieldIds, field.idField]);
        }
        setFields(fields.filter((_, i) => i !== index));
    };

    const moveFieldUp = (index: number) => {
        if (index === 0) return;
        const newFields = [...fields];
        [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
        newFields.forEach((field, idx) => field.orderIndex = idx);
        setFields(newFields);
        setEditingField(index - 1);
    };

    const moveFieldDown = (index: number) => {
        if (index === fields.length - 1) return;
        const newFields = [...fields];
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        newFields.forEach((field, idx) => field.orderIndex = idx);
        setFields(newFields);
        setEditingField(index + 1);
    };

    const handleSave = async () => {
        if (!namaForm.trim()) {
            showError('Nama form wajib diisi');
            return;
        }

        try {
            setSaving(true);

            // 1. Update form metadata
            await formService.update(idForm, {
                namaForm: namaForm.trim(),
                descForm: descForm.trim() || undefined,
                statusForm,
            });

            // 2. Delete removed fields
            for (const fieldId of deletedFieldIds) {
                await formFieldService.delete(fieldId);
            }

            // 3. Update/Create fields
            for (const field of fields) {
                // Normalize tipeField to lowercase (DB ENUM is lowercase)
                if (field.tipeField) {
                    field.tipeField = field.tipeField.toLowerCase() as any;
                }

                // Normalize smart quotes in nilaiPilihan
                if (field.nilaiPilihan) {
                    field.nilaiPilihan = field.nilaiPilihan
                        .replace(/[\u201C\u201D]/g, '"')
                        .replace(/[\u2018\u2019]/g, "'");
                }

                if (field.idField) {
                    // Update existing field
                    await formFieldService.update(field.idField, field);
                } else {
                    // Create new field
                    await formFieldService.create(idForm, field);
                }
            }

            showSuccess('Form berhasil diperbarui!');
            router.push('/admin/form-builder');
        } catch (error: any) {
            console.error('Error saving form:', error);
            showError(error.response?.data?.message || error.message || 'Gagal menyimpan form');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Form</h1>
                        <p className="text-sm text-gray-600 mt-1">Perbarui field dan konfigurasi form</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => router.back()}>
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={saving}
                        disabled={saving || !namaForm.trim()}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Perubahan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form Metadata + Field Palette */}
                <div className="space-y-6">
                    {/* Form Metadata */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Informasi Form</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Form <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={namaForm}
                                    onChange={(e) => setNamaForm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={descForm}
                                    onChange={(e) => setDescForm(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusForm}
                                    onChange={(e) => setStatusForm(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Aktif">Aktif</option>
                                    <option value="Non-Aktif">Non-Aktif</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Field Palette */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Tambah Field</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {FIELD_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => addField(type.value)}
                                    className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                                >
                                    <span className="text-2xl">{type.icon}</span>
                                    <span className="text-sm font-medium text-gray-700">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Form Canvas + Field Config */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Form Canvas */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Form Preview</h3>
                            <span className="text-sm text-gray-600">{fields.length} field(s)</span>
                        </div>

                        {fields.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>Belum ada field. Klik tombol di kiri untuk menambah field.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div
                                        key={(field as any).tempId || field.idField || `field-${index}`}
                                        className={`border rounded-lg p-4 cursor-pointer transition ${editingField === index
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        onClick={() => setEditingField(index)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {field.textDescription || field.namaField}
                                                    </span>
                                                    {field.required && (
                                                        <span className="text-red-600 text-xs">*</span>
                                                    )}
                                                    {/* Field Type Badge */}
                                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                        {FIELD_TYPES.find(t => t.value === field.tipeField?.toLowerCase())?.label || field.tipeField}
                                                    </span>
                                                    {field.idField && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            ID: {field.idField}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Variable: {field.namaField}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* Up Arrow */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveFieldUp(index);
                                                    }}
                                                    disabled={index === 0}
                                                    className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    title="Geser ke atas"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                {/* Down Arrow */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveFieldDown(index);
                                                    }}
                                                    disabled={index === fields.length - 1}
                                                    className={`p-1 rounded ${index === fields.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    title="Geser ke bawah"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteField(index);
                                                    }}
                                                    className="text-red-600 hover:bg-red-50 p-1 rounded ml-1"
                                                    title="Hapus field"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Field Config Panel */}
                    {editingField !== null && fields[editingField] && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Konfigurasi Field</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Variabel <span className="text-red-600">*</span>
                                    </label>
                                    <ComboBox
                                        options={templates.map(t => ({
                                            value: t.namaVariable,
                                            label: t.label,
                                            color: t.color,
                                            category: t.category
                                        }))}
                                        value={fields[editingField].namaField || ''}
                                        onChange={(value) => updateField(editingField, { namaField: value })}
                                        placeholder="Pilih template atau ketik custom..."
                                        allowCustom={true}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                                        <span>
                                            {loadingTemplates ? 'Loading templates...' : `${templates.length} templates tersedia • Atau ketik custom variable`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplateModal(true)}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            + Kelola Templates
                                        </button>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Label <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={fields[editingField].textDescription || ''}
                                        onChange={(e) => updateField(editingField, { textDescription: e.target.value })}
                                        placeholder="Nama Lengkap"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Teks yang ditampilkan di atas input</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Deskripsi (opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={fields[editingField].textWarning || ''}
                                        onChange={(e) => updateField(editingField, { textWarning: e.target.value })}
                                        placeholder="Penulisan nama harus lengkap dengan gelar"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 italic">Helper text di bawah label (font lebih kecil, miring)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Placeholder
                                    </label>
                                    <input
                                        type="text"
                                        value={fields[editingField].placeholder || ''}
                                        onChange={(e) => updateField(editingField, { placeholder: e.target.value })}
                                        placeholder="Masukkan nama lengkap..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="required"
                                        checked={fields[editingField].required || false}
                                        onChange={(e) => updateField(editingField, { required: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                                        Field wajib diisi (required)
                                    </label>
                                </div>

                                {(fields[editingField].tipeField?.toLowerCase() === 'select' ||
                                    fields[editingField].tipeField?.toLowerCase() === 'radio' ||
                                    fields[editingField].tipeField?.toLowerCase() === 'checkbox') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pilihan (Options)
                                            </label>
                                            <textarea
                                                value={fields[editingField].nilaiPilihan || '[]'}
                                                onChange={(e) => updateField(editingField, { nilaiPilihan: e.target.value })}
                                                placeholder='["Pilihan 1", "Pilihan 2", "Pilihan 3"]'
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Format JSON array. Gunakan tanda kutip lurus (" bukan ") untuk menghindari error.</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Variable Template Management Modal */}
            <VariableTemplateModal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                onUpdate={loadTemplates}
            />
        </div>
    );
}
