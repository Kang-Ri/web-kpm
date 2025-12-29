import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formService, Form } from '@/lib/api/form.service';
import { showError } from '@/lib/utils/toast';

interface FormTemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (idFormTemplate: number) => Promise<void>;
    isLoading?: boolean;
}

export const FormTemplateSelector: React.FC<FormTemplateSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    isLoading = false
}) => {
    const [templates, setTemplates] = useState<Form[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await formService.getAll({ formType: 'template' });
            const data = response.data.data || response.data;
            if (Array.isArray(data)) {
                setTemplates(data);
            }
        } catch (error) {
            showError('Gagal memuat template form');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async () => {
        if (!selectedId) {
            showError('Pilih template form terlebih dahulu');
            return;
        }

        await onSelect(selectedId);
        setSelectedId(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Pilih Template Form"
            size="md"
        >
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Belum ada template form
                    </div>
                ) : (
                    <div className="space-y-2">
                        {templates.map((template) => (
                            <label
                                key={template.idForm}
                                className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedId === template.idForm
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="formTemplate"
                                    value={template.idForm}
                                    checked={selectedId === template.idForm}
                                    onChange={() => setSelectedId(template.idForm)}
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {template.namaForm}
                                    </p>
                                    {template.descForm && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {template.descForm}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {template.fields?.length || 0} field
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSelect}
                        isLoading={isLoading}
                        disabled={!selectedId || isLoading}
                    >
                        Duplicate & Attach
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
