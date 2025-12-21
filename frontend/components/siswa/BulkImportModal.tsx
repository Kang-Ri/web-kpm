import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, Download, X, CheckCircle, XCircle } from 'lucide-react';
import { BulkImportResponse } from '@/lib/api/siswa.service';
import * as XLSX from 'xlsx';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<BulkImportResponse>;
    isLoading: boolean;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    isLoading
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file);
                setImportResult(null);
            }
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        try {
            const result = await onImport(selectedFile);
            setImportResult(result);
        } catch (error) {
            // Error handled by parent
        }
    };

    const handleDownloadTemplate = () => {
        // Create a simple Excel template
        // const csvContent = 'namaLengkap,jenjangKelas,asalSekolah,email\nContoh Siswa,10,SMA Negeri 1,siswa@example.com\n';
        // const blob = new Blob([csvContent], { type: 'text/xlsx;charset=utf-8;' });
        // const link = document.createElement('a');
        // link.href = URL.createObjectURL(blob);
        // link.download = 'Template_Import_Siswa.xlsx';
        // link.click();

        // 1. Definisikan header dan contoh data dalam bentuk Array of Arrays
        const data = [
            ['namaLengkap', 'jenjangKelas', 'asalSekolah', 'email'], // Baris 1: Header
            ['Contoh Siswa', '10', 'SMA Negeri 1', 'siswa@example.com'] // Baris 2: Contoh isi
        ];

        // 2. Buat worksheet (lembar kerja) dari data di atas
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // 3. Buat workbook (file excel-nya)
        const workbook = XLSX.utils.book_new();

        // Atur lebar kolom (optional)
        worksheet['!cols'] = [
            { wch: 25 }, // namaLengkap
            { wch: 15 }, // jenjangKelas
            { wch: 25 }, // asalSekolah
            { wch: 25 }, // email
        ];

        // 4. Masukkan worksheet ke dalam workbook dengan nama sheet "Template"
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        // 5. Generate file Excel dan otomatis download
        XLSX.writeFile(workbook, 'Template_Import_Siswa.xlsx');
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
            title="Import Siswa dari Excel"
            size="lg"
        >
            <div className="space-y-6">
                {/* Download Template */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-1">Template Excel</h4>
                            <p className="text-sm text-blue-700">
                                Download template untuk format yang benar. Kolom wajib: <strong>namaLengkap</strong> dan <strong>email</strong>.
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Password default untuk semua siswa: <strong>KPMUser</strong>
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Download}
                            onClick={handleDownloadTemplate}
                        >
                            Download Template
                        </Button>
                    </div>
                </div>

                {/* File Upload Area */}
                {!importResult && (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

                        {selectedFile ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">{selectedFile.name}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFile(null)}
                                >
                                    Pilih File Lain
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 mb-2">
                                    Drag & drop file Excel atau klik untuk memilih
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Format: .xlsx atau .xls (Max 5MB)
                                </p>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Pilih File
                                    </span>
                                </label>
                            </>
                        )}
                    </div>
                )}

                {/* Import Result */}
                {importResult && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-gray-900">{importResult.total}</p>
                                <p className="text-sm text-gray-600">Total Baris</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">{importResult.success.length}</p>
                                <p className="text-sm text-green-700">Berhasil</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-red-600">{importResult.failed.length}</p>
                                <p className="text-sm text-red-700">Gagal</p>
                            </div>
                        </div>

                        {/* Failed Items */}
                        {importResult.failed.length > 0 && (
                            <div className="border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                    <XCircle className="h-5 w-5" />
                                    Data yang Gagal Diimport
                                </h4>
                                <div className="space-y-2">
                                    {importResult.failed.map((item, index) => (
                                        <div key={index} className="bg-red-50 rounded p-3 text-sm">
                                            <p className="font-medium text-red-900">
                                                Baris {item.row}: {item.namaLengkap || '-'}
                                            </p>
                                            <p className="text-red-700">Email: {item.email || '-'}</p>
                                            <p className="text-red-600 text-xs mt-1">Error: {item.error}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    {importResult ? (
                        <Button variant="primary" onClick={handleClose}>
                            Tutup
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={handleClose}>
                                Batal
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleImport}
                                disabled={!selectedFile || isLoading}
                                isLoading={isLoading}
                            >
                                Import Sekarang
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};
