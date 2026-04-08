'use client';

import { FC, useEffect, useState } from 'react';
import { X, Loader2, Send, ChevronDown } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface FormField {
    idField: number;
    namaField: string;
    tipeField: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
    nilaiPilihan?: string; // JSON string of options
    required: boolean;
    textDescription?: string; // label
    textWarning?: string;
    placeholder?: string;
    orderIndex: number;
}

interface FormData {
    idForm: number;
    namaForm: string;
    descForm?: string;
    fields: FormField[];
}

interface DaftarUlangFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    idForm: number;
    idSiswaKelas: number;
    namaKelas: string;
    siswaProfile: {
        namaLengkap?: string;
        email?: string;
        noHp?: string;
        tempatLahir?: string;
        tanggalLahir?: string;
        jenisKelamin?: string;
        jenjangKelas?: string;
        asalSekolah?: string;
        agama?: string;
        [key: string]: string | undefined;
    };
    onSubmitted: (orderResult: any) => void;
}

export const DaftarUlangFormModal: FC<DaftarUlangFormModalProps> = ({
    isOpen,
    onClose,
    idForm,
    idSiswaKelas,
    namaKelas,
    siswaProfile,
    onSubmitted,
}) => {
    const [form, setForm] = useState<FormData | null>(null);
    const [isLoadingForm, setIsLoadingForm] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && idForm) {
            fetchForm();
        }
    }, [isOpen, idForm]);

    const fetchForm = async () => {
        try {
            setIsLoadingForm(true);
            const res = await apiClient.get(`/cms/forms/${idForm}/view`);
            const formData: FormData = res.data?.data || res.data;

            setForm(formData);

            // Auto-prefill: match namaField to siswaProfile keys
            const prefilled: Record<string, string> = {};
            console.log('DEBUG: siswaProfile in Modal:', siswaProfile);
            
            formData.fields.forEach(field => {
                const profileValue = siswaProfile[field.namaField];
                if (profileValue) {
                    prefilled[field.namaField] = profileValue;
                } else {
                    // Smart mapping fallback
                    const fieldLabel = (field.textDescription || '').toLowerCase().trim();
                    const fieldName = (field.namaField || '').toLowerCase().trim();

                    // NISN / ID Member Detection
                    const isIdField = 
                        fieldLabel.includes('id member') || 
                        fieldLabel.includes('nisn') || 
                        fieldName.includes('idmember') || 
                        fieldName.includes('nisn');

                    if (isIdField && siswaProfile.nisn) {
                        console.log(`DEBUG: Prefilling ${field.namaField} (${fieldLabel}) with NISN: ${siswaProfile.nisn}`);
                        prefilled[field.namaField] = siswaProfile.nisn;
                    }

                    // Special mapping for 'Kelas' label if it's currently 8 but named differently
                    if (fieldLabel === 'kelas' && siswaProfile.jenjangKelas) {
                         prefilled[field.namaField] = siswaProfile.jenjangKelas;
                    }
                }
            });
            setResponses(prefilled);
        } catch (err) {
            console.error('Error fetching form:', err);
            toast.error('Gagal memuat form. Silakan coba lagi.');
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleChange = (namaField: string, value: string) => {
        setResponses(prev => ({ ...prev, [namaField]: value }));
        if (errors[namaField]) {
            setErrors(prev => { const e = { ...prev }; delete e[namaField]; return e; });
        }
    };

    const validate = (): boolean => {
        if (!form) return false;
        const newErrors: Record<string, string> = {};
        form.fields.forEach(field => {
            if (field.required && (!responses[field.namaField] || responses[field.namaField].trim() === '')) {
                newErrors[field.namaField] = field.textWarning || `${field.textDescription || field.namaField} wajib diisi.`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error('Mohon lengkapi semua field yang wajib diisi.');
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await apiClient.post(`/cms/forms/${idForm}/submit`, {
                responses,
                idSiswaKelas,
            });

            toast.success('Form berhasil diisi!');
            onSubmitted(result.data?.data || result.data);
        } catch (err: any) {
            console.error('Error submitting form:', err);
            toast.error(err.response?.data?.message || err.message || 'Gagal mengirim form. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseOptions = (nilaiPilihan?: string): string[] => {
        if (!nilaiPilihan) return [];
        try {
            const parsed = JSON.parse(nilaiPilihan);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return nilaiPilihan.split(',').map(s => s.trim());
        }
    };

    const renderField = (field: FormField) => {
        const label = field.textDescription || field.namaField;
        const value = responses[field.namaField] || '';
        const error = errors[field.namaField];
        const options = parseOptions(field.nilaiPilihan);

        const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
            error
                ? 'border-red-400 focus:ring-red-300 bg-red-50'
                : 'border-gray-300 focus:ring-blue-300 focus:border-blue-400'
        }`;

        return (
            <div key={field.idField} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.tipeField === 'textarea' ? (
                    <textarea
                        className={`${baseInputClass} resize-none`}
                        rows={3}
                        value={value}
                        placeholder={field.placeholder || ''}
                        onChange={e => handleChange(field.namaField, e.target.value)}
                    />
                ) : field.tipeField === 'select' ? (
                    <div className="relative">
                        <select
                            className={`${baseInputClass} appearance-none pr-8`}
                            value={value}
                            onChange={e => handleChange(field.namaField, e.target.value)}
                        >
                            <option value="">-- Pilih --</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                ) : field.tipeField === 'radio' ? (
                    <div className="flex flex-wrap gap-3 mt-1">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={field.namaField}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={e => handleChange(field.namaField, e.target.value)}
                                    className="text-blue-600"
                                />
                                <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                ) : field.tipeField === 'checkbox' ? (
                    <div className="flex flex-wrap gap-3 mt-1">
                        {options.map(opt => {
                            const checked = value.split(',').includes(opt);
                            return (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={e => {
                                            const current = value ? value.split(',') : [];
                                            const updated = e.target.checked
                                                ? [...current, opt]
                                                : current.filter(v => v !== opt);
                                            handleChange(field.namaField, updated.join(','));
                                        }}
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <input
                        type={field.tipeField}
                        className={baseInputClass}
                        value={value}
                        placeholder={field.placeholder || ''}
                        onChange={e => handleChange(field.namaField, e.target.value)}
                    />
                )}

                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Form Daftar Ulang</h2>
                        <p className="text-blue-100 text-sm">{namaKelas}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoadingForm ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                            <p className="text-sm text-gray-500">Memuat form...</p>
                        </div>
                    ) : form ? (
                        <>
                            {form.descForm && (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded text-sm text-blue-800">
                                    {form.descForm}
                                </div>
                            )}
                            {form.fields.sort((a, b) => a.orderIndex - b.orderIndex).map(renderField)}
                        </>
                    ) : (
                        <p className="text-center text-gray-500">Form tidak tersedia.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLoadingForm}
                        className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                        ) : (
                            <><Send className="w-4 h-4" /> Kirim Form</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
