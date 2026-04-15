import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Ghost, Loader2, Calendar, User, Hash } from 'lucide-react';
import { materiButtonService } from '@/lib/api/materiButton.service';

interface ClickLog {
    idClick: number;
    idSiswa: number;
    nisn: string;
    namaLengkap: string;
    email: string;
    tanggalKlik: string;
}

interface ButtonClickModalProps {
    isOpen: boolean;
    onClose: () => void;
    idButton: number | null;
    buttonName: string;
}

export const ButtonClickModal: React.FC<ButtonClickModalProps> = ({
    isOpen,
    onClose,
    idButton,
    buttonName
}) => {
    const [clickLogs, setClickLogs] = useState<ClickLog[]>([]);
    const [stats, setStats] = useState({ totalClicks: 0, uniqueUsers: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && idButton) {
            fetchLogs();
        }
    }, [isOpen, idButton]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await materiButtonService.getButtonClicks(idButton!);
            const data = response.data.data || response.data;
            
            setClickLogs(data.clicks || []);
            setStats({
                totalClicks: data.totalClicks || 0,
                uniqueUsers: data.uniqueUsers || 0
            });
        } catch (error) {
            console.error('Failed to fetch click logs:', error);
            setClickLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Log Akses: ${buttonName}`}
            size="xl"
        >
            <div className="space-y-6 py-2">
                {/* Stats Header */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                            <Ghost className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Klik</p>
                            <p className="text-xl font-black text-blue-900">{stats.totalClicks}</p>
                        </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Siswa Unik</p>
                            <p className="text-xl font-black text-purple-900">{stats.uniqueUsers}</p>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Memuat data akses...</p>
                        </div>
                    ) : clickLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                <Ghost className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-900">Belum ada aktivitas</p>
                                <p className="text-xs font-medium">Belum ada siswa yang menekan tombol ini.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Siswa</th>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">NISN</th>
                                        <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Waktu Klik</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clickLogs.map((log, idx) => (
                                        <tr 
                                            key={log.idClick} 
                                            className={`
                                                group transition-colors
                                                ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                                                hover:bg-blue-50/50
                                            `}
                                        >
                                            <td className="py-4 px-6 border-b border-gray-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                                                        {log.namaLengkap.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-gray-900 truncate uppercase tracking-tight">
                                                            {log.namaLengkap}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 font-medium truncate">
                                                            {log.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 border-b border-gray-100/50">
                                                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg w-fit">
                                                    <Hash className="w-3 h-3 opacity-40" />
                                                    {log.nisn}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 border-b border-gray-100/50 text-right">
                                                <div className="inline-flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-800">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                        {formatDate(log.tanggalKlik)}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">TERETEKSI</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black underline">i</span>
                    </div>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Data ini mencatat setiap kali siswa menekan tombol materi di dashboard mereka. 
                        Waktu yang ditampilkan menggunakan waktu server saat aktivitas dideteksi.
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        Tutup Panel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
