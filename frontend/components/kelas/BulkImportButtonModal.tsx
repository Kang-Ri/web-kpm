import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Table } from 'lucide-react';
import { showSuccess, showError } from '@/lib/utils/toast';
import * as XLSX from 'xlsx';
import { materiButtonService } from '@/lib/api/materiButton.service';

interface BulkImportButtonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
    idParent2: number;
    materiList: Array<{ idProduk: number; namaProduk: string }>;
}

interface ImportResult {
    success: Array<{ row: number; namaButton: string; idProduk: number; namaProduk: string; id: number }>;
    failed: Array<{ row: number; namaButton: string; idProduk: string | number; error: string }>;
    total: number;
}

export const BulkImportButtonModal: React.FC<BulkImportButtonModalProps> = ({
    isOpen,
    onClose,
    onImportComplete,
    idParent2,
    materiList
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
        const data = [
            ['ID Produk', 'Judul', 'Nama Button', 'Link', 'Deskripsi'],
            [25, 'Download Materi', 'Download PDF', 'https://drive.google.com/...', 'File materi dalam format PDF'],
            [25, 'Video Tutorial', 'Tonton Video', 'https://youtube.com/...', 'Video penjelasan materi'],
            [26, 'Latihan Soal', 'Kerjakan Quiz', 'https://quiz.com/...', 'Quiz interaktif']
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        worksheet['!cols'] = [
            { wch: 12 }, // ID Produk
            { wch: 20 }, // Judul
            { wch: 20 }, // Nama Button
            { wch: 50 }, // Link
            { wch: 35 }, // Deskripsi
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Button');
        XLSX.writeFile(workbook, 'Template_Bulk_Import_Button.xlsx');
    };

    const handleImport = async () => {
        if (!selectedFile) {
            showError('Pilih file Excel terlebih dahulu');
            return;
        }

        try {
            setImporting(true);

            const response = await materiButtonService.bulkImport(selectedFile, idParent2);

            const result = response.data.data;

            setImportResult(result);

            if (result.success.length > 0) {
                showSuccess(`Berhasil import ${result.success.length} button`);
            }

            if (result.failed.length > 0) {
                showError(`${result.failed.length} button gagal di-import`);
            }

        } catch (error: any) {
            showError(error.message || 'Gagal melakukan import');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        // Refresh data if import was successful
        if (importResult && importResult.success.length > 0) {
            onImportComplete();
        }

        setSelectedFile(null);
        setImportResult(null);
        onClose();
    };

    const handleDownloadFailedData = () => {
        if (!importResult || importResult.failed.length === 0) return;

        const failedData = importResult.failed.map((item: any) => {
            const materiName = materiList.find(m => m.idProduk === parseInt(item.idProduk))?.namaProduk || 'Unknown';
            return {
                'Row': item.row,
                'ID Produk': item.idProduk,
                'Nama Materi': materiName,
                'Nama Button': item.namaButton,
                'Error': item.error
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(failedData);
        const workbook = XLSX.utils.book_new();

        worksheet['!cols'] = [
            { wch: 8 },  // Row
            { wch: 12 }, // ID Produk
            { wch: 30 }, // Nama Materi
            { wch: 25 }, // Nama Button
            { wch: 50 }, // Error
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Data');
        XLSX.writeFile(workbook, `Failed_Button_Import_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const getMateriName = (idProduk: number | string): string => {
        const id = typeof idProduk === 'string' ? parseInt(idProduk) : idProduk;
        const materi = materiList.find(m => m.idProduk === id);
        return materi ? materi.namaProduk : `ID ${id}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Button Kolektif"
            size="xl"
        >
            <div className="space-y-6">
                {/* Materi Table */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Table className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Daftar ID Materi</h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-blue-100 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">ID</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Nama Materi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {materiList.map((m) => (
                                    <tr key={m.idProduk} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-mono text-blue-600">{m.idProduk}</td>
                                        <td className="px-3 py-2">{m.namaProduk}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                        📋 Gunakan ID di atas pada kolom "ID Produk" di file Excel
                    </p>
                </div>

                {/* Download Template */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FileSpreadsheet className="w-10 h-10 text-green-600" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Download Template Excel</h4>
                        <p className="text-sm text-gray-600">Download template untuk memulai upload</p>
                    </div>
                    <Button variant="secondary" onClick={handleDownloadTemplate} size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                </div>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="bulk-button-upload"
                    />
                    <label
                        htmlFor="bulk-button-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        {selectedFile ? (
                            <>
                                <CheckCircle className="w-12 h-12 text-green-600" />
                                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">Klik untuk ganti file</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400" />
                                <p className="text-sm font-medium text-gray-700">Klik untuk upload file Excel</p>
                                <p className="text-xs text-gray-500">File .xlsx atau .xls</p>
                            </>
                        )}
                    </label>
                </div>

                {/* Import Results */}
                {importResult && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Hasil Import</h3>
                            {importResult.failed.length > 0 && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleDownloadFailedData}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Data Gagal
                                </Button>
                            )}
                        </div>

                        {/* Success */}
                        {importResult.success.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-800">
                                        Berhasil: {importResult.success.length}
                                    </span>
                                </div>
                                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                    {importResult.success.map((item: any, idx: any) => (
                                        <div key={idx} className="text-green-700">
                                            Row {item.row}: {item.namaButton} → <span className="font-semibold">{getMateriName(item.idProduk)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Failed */}
                        {importResult.failed.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold text-red-800">
                                        Gagal: {importResult.failed.length}
                                    </span>
                                </div>
                                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                    {importResult.failed.map((item: any, idx: any) => (
                                        <div key={idx} className="text-red-700">
                                            Row {item.row}: {item.namaButton} → <span className="font-semibold">{getMateriName(item.idProduk)}</span> - {item.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={handleClose}>
                        {importResult ? 'Tutup' : 'Batal'}
                    </Button>
                    {!importResult && (
                        <Button
                            variant="primary"
                            onClick={handleImport}
                            isLoading={importing}
                            disabled={!selectedFile || importing}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
