'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formService, FormField } from '@/lib/api/form.service';
import { userService } from '@/lib/api/user.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Send, UserCheck } from 'lucide-react';

export default function FormSubmitPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const idForm = parseInt(params.idForm as string);
    const idSiswaKelas = searchParams.get('idSiswaKelas') ? parseInt(searchParams.get('idSiswaKelas')!) : null;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formMeta, setFormMeta] = useState<any>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [autoFillEnabled, setAutoFillEnabled] = useState(true);
    const [userDataLoaded, setUserDataLoaded] = useState(false);

    useEffect(() => {
        loadForm();
    }, [idForm]);

    const loadForm = async () => {
        try {
            setLoading(true);
            const response = await formService.getById(idForm);
            const formData = (response.data as any).data || response.data;

            setFormMeta({
                idForm: formData.idForm,
                namaForm: formData.namaForm,
                descForm: formData.descForm,
            });

            // Sort fields by orderIndex to maintain order
            const sortedFields = (formData.fields || []).sort((a: any, b: any) =>
                (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );
            setFields(sortedFields);

            // Auto-fill from user data if enabled
            if (autoFillEnabled && !userDataLoaded) {
                await loadUserDataAndAutoFill(sortedFields);
            }
        } catch (error: any) {
            showError(error.message || 'Form tidak ditemukan');
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const loadUserDataAndAutoFill = async (fieldsToFill: FormField[]) => {
        try {
            const userResponse = await userService.getMe();
            const userData = (userResponse.data as any).data || userResponse.data;

            // Field name mapping (snake_case template -> camelCase API)
            const fieldMapping: Record<string, string> = {
                'nama_lengkap': 'namaLengkap',
                'no_hp': 'noHp',
                'tanggal_lahir': 'tanggalLahir',
                'jenis_kelamin': 'jenisKelamin',
                'alamat': 'alamatLengkap',
                'kelas': 'jenjangKelas',
                'tempat_lahir': 'tempatLahir',
                'asal_sekolah': 'asalSekolah',
            };

            // Auto-fill matching fields
            const autoFilled: Record<string, any> = {};
            fieldsToFill.forEach(field => {
                // Try exact match first  
                let value = userData.siswa?.[field.namaField];

                // Try mapped field name
                if (!value && fieldMapping[field.namaField]) {
                    value = userData.siswa?.[fieldMapping[field.namaField]];
                }

                // Special: email fallback to user email
                if (field.namaField === 'email' && !value) {
                    value = userData.email;
                }

                if (value !== undefined && value !== null) {
                    autoFilled[field.namaField] = value;
                }
            });

            setResponses(autoFilled);
            setUserDataLoaded(true);
            console.log('✅ Auto-filled fields:', Object.keys(autoFilled));
        } catch (error) {
            console.warn('⚠️ Failed to auto-fill user data:', error);
            // Silently fail - user can still fill manually
        }
    };

    const handleChange = (namaField: string, value: any) => {
        setResponses(prev => ({ ...prev, [namaField]: value }));
        // Clear error when user types
        if (errors[namaField]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[namaField];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        fields.forEach(field => {
            if (field.required) {
                const value = responses[field.namaField];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    newErrors[field.namaField] = field.textWarning || `${field.textDescription || field.namaField} wajib diisi`;
                }
            }

            // Email validation
            if (field.tipeField === 'email' && responses[field.namaField]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(responses[field.namaField])) {
                    newErrors[field.namaField] = 'Format email tidak valid';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            showError('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        try {
            setSubmitting(true);

            // Call submission API
            const result = await formService.submitForm(idForm, {
                responses,
                idSiswaKelas // Pass enrollment ID if present
            });

            console.log('✅ Submission Result:', result);

            showSuccess('Form berhasil dikirim! Order ID: ' + (result.data?.idOrder || 'N/A'));

            // Check if payment needed
            if (result.data?.needsPayment && result.data?.hargaFinal > 0) {
                showSuccess(`Total Pembayaran: Rp ${result.data.hargaFinal.toLocaleString('id-ID')}`);
                // TODO: Redirect to payment page or show payment instructions
            }

            // Redirect to success page or home
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (error: any) {
            console.error('❌ Submission Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim form';
            showError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: FormField) => {
        const value = responses[field.namaField] || '';
        const hasError = !!errors[field.namaField];

        // Normalize field type to lowercase for consistency
        const fieldType = field.tipeField?.toLowerCase();

        const commonInputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${hasError ? 'border-red-500' : 'border-gray-300'
            }`;

        switch (fieldType) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <input
                        type={field.tipeField}
                        value={value}
                        onChange={(e) => handleChange(field.namaField, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={commonInputClass}
                        required={field.required}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleChange(field.namaField, e.target.value)}
                        placeholder={field.placeholder || ''}
                        rows={4}
                        className={commonInputClass}
                        required={field.required}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => handleChange(field.namaField, e.target.value)}
                        className={commonInputClass}
                        required={field.required}
                    />
                );

            case 'select':
                try {
                    const options = field.nilaiPilihan ? JSON.parse(field.nilaiPilihan) : [];
                    return (
                        <select
                            value={value}
                            onChange={(e) => handleChange(field.namaField, e.target.value)}
                            className={commonInputClass}
                            required={field.required}
                        >
                            <option value="">-- Pilih --</option>
                            {options.map((option: string, idx: number) => (
                                <option key={idx} value={option}>{option}</option>
                            ))}
                        </select>
                    );
                } catch {
                    return <div className="text-red-500 text-sm">Error loading options</div>;
                }

            case 'radio':
                try {
                    const options = field.nilaiPilihan ? JSON.parse(field.nilaiPilihan) : [];
                    return (
                        <div className="space-y-2">
                            {options.map((option: string, idx: number) => (
                                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={field.namaField}
                                        value={option}
                                        checked={value === option}
                                        onChange={(e) => handleChange(field.namaField, e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                        required={field.required}
                                    />
                                    <span className="text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    );
                } catch {
                    return <div className="text-red-500 text-sm">Error loading options</div>;
                }

            case 'checkbox':
                try {
                    const options = field.nilaiPilihan ? JSON.parse(field.nilaiPilihan) : [];
                    const selectedValues = Array.isArray(value) ? value : [];

                    return (
                        <div className="space-y-2">
                            {options.map((option: string, idx: number) => (
                                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={option}
                                        checked={selectedValues.includes(option)}
                                        onChange={(e) => {
                                            const newValues = e.target.checked
                                                ? [...selectedValues, option]
                                                : selectedValues.filter((v: string) => v !== option);
                                            handleChange(field.namaField, newValues);
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    );
                } catch {
                    return <div className="text-red-500 text-sm">Error loading options</div>;
                }

            case 'file':
                return (
                    <input
                        type="file"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            // TODO: Handle file upload
                            handleChange(field.namaField, file?.name || '');
                        }}
                        className={commonInputClass}
                        required={field.required}
                    />
                );

            default:
                return <div className="text-gray-500">Field type not supported: {fieldType} (original: {field.tipeField})</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">Loading form...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{formMeta?.namaForm}</h1>
                    {formMeta?.descForm && (
                        <p className="text-gray-600 mt-2">{formMeta.descForm}</p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    {fields.map((field) => (
                        <div key={field.idField}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.textDescription || field.namaField}
                                {field.required && <span className="text-red-600 ml-1">*</span>}
                            </label>

                            {renderField(field)}

                            {errors[field.namaField] && (
                                <p className="mt-1 text-sm text-red-600">{errors[field.namaField]}</p>
                            )}
                        </div>
                    ))}

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button variant="ghost" type="button" onClick={() => router.back()}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={submitting}
                            disabled={submitting}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Kirim Form
                        </Button>
                    </div>
                </form>

                {/* Debug Info (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Debug - Responses:</h3>
                        <pre className="text-xs overflow-auto">{JSON.stringify(responses, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
