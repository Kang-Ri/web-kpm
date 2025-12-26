import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/utils/toast';
import * as XLSX from 'xlsx';
import { siswaKelasService } from '@/lib/api/siswaKelas.service';
import { parentProduct2Service } from '@/lib/api/parentProduct2.service';

interface BulkImportSiswaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
    idParent2: number;
    namaRuangKelas: string;
}

interface ImportResult {
    success: Array<{
        row: number;
        email: string;
        namaLengkap: string;
        statusEnrollment: string;
        isNewAccount: boolean;
        id: number;
    }>;
    failed: Array<{
        row: number;
        email: string;
        namaLengkap: string;
        error: string;
    }>;
    total: number;
}

interface RuangKelas {
    idParent2: number;
    namaParent2: string;
    jenjangKelasIzin?: string[];
}

export const BulkImportSiswaModal: React.FC<BulkImportSiswaModalProps> = ({
    isOpen,
    onClose,
    onImportComplete,
    idParent2,
    namaRuangKelas
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [ruangKelasList, setRuangKelasList] = useState<RuangKelas[]>([]);
    const [loadingKelas, setLoadingKelas] = useState(false);

    // Fetch ruang kelas list
    useEffect(() => {
        if (isOpen && idParent2) {
            fetchRuangKelasList();
        }
    }, [isOpen, idParent2]);

    const fetchRuangKelasList = async () => {
        try {
            setLoadingKelas(true);
            const response = await parentProduct2Service.getAll({ idParent1: idParent2 });
            setRuangKelasList(response.data.data || []);
        } catch (error: any) {
            showError('Gagal memuat daftar ruang kelas');
        } finally {
            setLoadingKelas(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await siswaKelasService.downloadImportTemplate(idParent2);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Template_Import_Siswa_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            showError(error.message || 'Gagal mendownload template');
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            showError('Pilih file Excel terlebih dahulu');
            return;
        }

        try {
            setImporting(true);

            const response = await siswaKelasService.bulkImportSiswa(selectedFile, idParent2);
            const result = response.data.data || response.data;

            setImportResult(result);

            if (result.success.length > 0) {
                showSuccess(`Berhasil import ${result.success.length} siswa`);
            }

            if (result.failed.length > 0) {
                showError(`${result.failed.length} siswa gagal di-import`);
            }

        } catch (error: any) {
            showError(error.message || 'Gagal melakukan import');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadFailedData = () => {
        if (!importResult || importResult.failed.length === 0) return;

        const failedData = importResult.failed.map((item) => ({
            'Row': item.row,
            'Email': item.email,
            'Nama Lengkap': item.namaLengkap,
            'Error': item.error
        }));

        const worksheet = XLSX.utils.json_to_sheet(failedData);
        const workbook = XLSX.utils.book_new();

        worksheet['!cols'] = [
            { wch: 8 },  // Row
            { wch: 30 }, // Email
            { wch: 30 }, // Nama Lengkap
            { wch: 50 }, // Error
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Data');
        XLSX.writeFile(workbook, `Failed_Siswa_Import_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Import Siswa ke ${namaRuangKelas}`}
            size="xl"
        >
            <div className="space-y-6">
                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Informasi Penting</h3>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        <li>Jika <strong>email belum terdaftar</strong>, sistem akan membuat akun baru otomatis</li>
                        <li>Password default untuk akun baru: <code className="bg-gray-200 px-2 py-0.5 rounded">email123</code></li>
                        <li>Siswa wajib ganti password saat login pertama kali</li>
                        <li>Siswa akan langsung di-enroll ke kelas sesuai <strong>ID Ruang Kelas</strong> di Excel</li>
                        <li>
                            <strong>Status Enrollment valid:</strong>{' '}
                            <code className="bg-green-100 text-green-700 px-2 py-0.5 rounded mx-1">Aktif</code>
                            <code className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mx-1">Pending</code>
                            <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded mx-1">Lulus</code>
                            <code className="bg-red-100 text-red-700 px-2 py-0.5 rounded mx-1">Dropout</code>
                        </li>
                    </ul>
                </div>

                {/* Ruang Kelas Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">📋 Daftar ID Ruang Kelas</h3>
                        <p className="text-xs text-gray-600 mt-1">Gunakan ID ini di kolom "ID Ruang Kelas" pada Excel</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loadingKelas ? (
                            <div className="py-8 text-center text-gray-500">Loading...</div>
                        ) : ruangKelasList.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">Tidak ada ruang kelas</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Nama Ruang Kelas</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Jenjang Kelas Izin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ruangKelasList.map((kelas) => (
                                        <tr key={kelas.idParent2} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-mono font-semibold text-blue-600">{kelas.idParent2}</td>
                                            <td className="px-4 py-2 text-gray-900">{kelas.namaParent2}</td>
                                            <td className="px-4 py-2 text-gray-600">
                                                {kelas.jenjangKelasIzin && kelas.jenjangKelasIzin.length > 0
                                                    ? `Kelas ${kelas.jenjangKelasIzin.join(', ')}`
                                                    : 'Semua Jenjang'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Download Template */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FileSpreadsheet className="w-10 h-10 text-green-600" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Download Template Excel</h4>
                        <p className="text-sm text-gray-600">Download template khusus untuk kelas ini</p>
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
                        id="bulk-siswa-upload"
                    />
                    <label
                        htmlFor="bulk-siswa-upload"
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
                                    {importResult.success.map((item, idx) => (
                                        <div key={idx} className="text-green-700">
                                            Row {item.row}: <span className="font-semibold">{item.namaLengkap}</span> ({item.email})
                                            {item.isNewAccount && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Akun Baru</span>}
                                            {' → '}<span className="font-medium">{item.statusEnrollment}</span>
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
                                    {importResult.failed.map((item, idx) => (
                                        <div key={idx} className="text-red-700">
                                            Row {item.row}: {item.namaLengkap} ({item.email}) - {item.error}
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
