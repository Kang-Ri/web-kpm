import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/utils/toast';
import * as XLSX from 'xlsx';
import { productService } from '@/lib/api/product.service';

interface ImportMateriModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
    idParent2: number;
}

interface ImportResult {
    success: Array<{ row: number; name: string; id: number }>;
    failed: Array<{ row: number; name: string; error: string }>;
    total: number;
}

export const ImportMateriModal: React.FC<ImportMateriModalProps> = ({
    isOpen,
    onClose,
    onImportComplete,
    idParent2
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleDownloadTemplate = () => {
        // Define header and sample data
        const data = [
            ['Nama Materi', 'Deskripsi', 'Kategori Harga', 'Harga Jual', 'Harga Coret', 'Auth', 'Tanggal Publish'],
            ['Contoh Materi 1', 'Deskripsi singkat materi', 'Gratis', 0, 0, 'Umum', ''],
            ['Contoh Materi 2', 'Materi berbayar', 'Bernominal', 100000, 150000, 'Khusus', '2024-12-25 14:30:00']
        ];

        // Create worksheet from array of arrays
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Set column widths
        worksheet['!cols'] = [
            { wch: 25 }, // Nama Materi
            { wch: 35 }, // Deskripsi
            { wch: 18 }, // Kategori Harga
            { wch: 12 }, // Harga Jual
            { wch: 12 }, // Harga Coret
            { wch: 10 }, // Auth
            { wch: 18 }, // Tanggal Publish
        ];

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Materi');

        // Generate and download file
        XLSX.writeFile(workbook, 'Template_Import_Materi.xlsx');
    };

    const handleImport = async () => {
        if (!selectedFile) {
            showError('Pilih file Excel terlebih dahulu');
            return;
        }

        try {
            setImporting(true);

            const response = await productService.importMateri(selectedFile, idParent2);

            // Axios wraps response: { data: { message: "...", data: {...} } }
            const result = response.data.data;

            setImportResult(result);

            if (result.success.length > 0) {
                showSuccess(`Berhasil import ${result.success.length} materi`);
                onImportComplete();
            }

            if (result.failed.length > 0) {
                showError(`${result.failed.length} materi gagal di-import`);
            }

        } catch (error: any) {
            showError(error.message || 'Gagal melakukan import');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setImportResult(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Materi dari Excel"
            size="lg"
        >
            <div className="space-y-4">
                {/* Download Template */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Download Template Excel</p>
                            <p className="text-xs text-blue-700 mt-1">
                                Download template untuk melihat format yang benar
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Download}
                            onClick={handleDownloadTemplate}
                        >
                            Template
                        </Button>
                    </div>
                </div>

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih File Excel
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">
                            Selected: <span className="font-medium">{selectedFile.name}</span>
                        </p>
                    )}
                </div>

                {/* Import Results */}
                {importResult && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-3">Hasil Import</h4>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{importResult.total}</p>
                                <p className="text-xs text-gray-600">Total</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{importResult.success.length}</p>
                                <p className="text-xs text-gray-600">Berhasil</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{importResult.failed.length}</p>
                                <p className="text-xs text-gray-600">Gagal</p>
                            </div>
                        </div>

                        {/* Success List */}
                        {importResult.success.length > 0 && (
                            <div className="mb-3">
                                <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Berhasil ({importResult.success.length})
                                </p>
                                <div className="max-h-32 overflow-y-auto text-xs text-gray-600 space-y-1">
                                    {importResult.success.slice(0, 5).map((item, idx) => (
                                        <div key={idx}>Row {item.row}: {item.name}</div>
                                    ))}
                                    {importResult.success.length > 5 && (
                                        <div className="text-gray-500">...dan {importResult.success.length - 5} lainnya</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Failed List */}
                        {importResult.failed.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    Gagal ({importResult.failed.length})
                                </p>
                                <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                                    {importResult.failed.map((item, idx) => (
                                        <div key={idx}>Row {item.row}: {item.name} - {item.error}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={importing}
                    >
                        {importResult ? 'Tutup' : 'Batal'}
                    </Button>
                    <Button
                        variant="primary"
                        icon={Upload}
                        onClick={handleImport}
                        disabled={!selectedFile || importing}
                        isLoading={importing}
                    >
                        {importing ? 'Mengimport...' : 'Import'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
