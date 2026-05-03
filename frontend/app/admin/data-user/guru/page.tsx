'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Search, Trash } from 'lucide-react';
import { userService, UserProfile } from '@/lib/api/user.service';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { showSuccess, showError } from '@/lib/utils/toast';

const GURU_ROLE_OPTIONS = [
    { id: 3, name: 'Guru' },
];

function GuruListContent() {
    const [mounted, setMounted] = useState(false);
    const [userList, setUserList] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk operations states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchUsers();
        }
    }, [debouncedSearchTerm, page, limit, mounted]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params: any = { page, limit, role: 'Guru' };
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const response = await userService.getAllUsers(params);
            const result = response.data as any;
            
            if (result && Array.isArray(result.data)) {
                setUserList(result.data);
                setTotalItems(result.totalItems || 0);
                setTotalPages(result.totalPages || 1);
            }
        } catch (error: any) {
            showError('Gagal memuat data guru');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            if (selectedUser) {
                await userService.updateUser(selectedUser.idUser, data);
                showSuccess('Data guru berhasil diperbarui');
            } else {
                await userService.createUser(data);
                showSuccess('Guru baru berhasil ditambahkan');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal menyimpan data guru');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data guru ini?')) return;
        try {
            await userService.deleteUser(id);
            showSuccess('Data guru berhasil dihapus');
            fetchUsers();
        } catch (error) {
            showError('Gagal menghapus data guru');
        }
    };

    const handleSelectUser = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === userList.length && userList.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(userList.map(u => u.idUser));
        }
    };

    if (!mounted) {
        return <div className="space-y-6"><div className="text-center py-8 text-gray-500">Loading...</div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Data Guru</h1>
                    <p className="text-gray-600 mt-1">Kelola data pengajar dan instruktur</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="primary" icon={Plus} onClick={handleCreate}>
                        Tambah Guru
                    </Button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-900 font-medium">
                            {selectedIds.length} guru dipilih
                        </span>
                    </div>
                    <Button variant="danger" icon={Trash} onClick={() => {}} size="sm" disabled>
                        Hapus yang Dipilih (Comming Soon)
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Guru</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Peran Aktif</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">Guru</p>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={10}>10 Baris</option>
                                <option value={50}>50 Baris</option>
                                <option value={100}>100 Baris</option>
                                <option value={200}>200 Baris</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : userList.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Tidak ada data guru</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.length === userList.length && userList.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">No</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Lengkap</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userList.map((user, index) => (
                                                <tr
                                                    key={user.idUser}
                                                    className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.includes(user.idUser) ? 'bg-blue-50' : ''}`}
                                                >
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(user.idUser)}
                                                            onChange={() => handleSelectUser(user.idUser)}
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">{(page - 1) * limit + index + 1}</td>
                                                    <td className="py-3 px-4 font-medium text-gray-900">{user.namaLengkap}</td>
                                                    <td className="py-3 px-4">{user.email || '-'}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="info">
                                                            {(user as any).role?.namaRole || user.role || 'Guru'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-2 hover:bg-blue-50 rounded" title="Edit" onClick={() => handleEdit(user)}>
                                                                <Edit className="h-4 w-4 text-blue-600" />
                                                            </button>
                                                            <button className="p-2 hover:bg-red-50 rounded" title="Delete" onClick={() => handleDelete(user.idUser)}>
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Menampilkan <span className="font-medium">{(page - 1) * limit + 1}</span> sampai <span className="font-medium">{Math.min(page * limit, totalItems)}</span> dari <span className="font-medium">{totalItems}</span> guru
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                            Sebelumnya
                                        </Button>
                                        <div className="text-sm font-medium px-4 py-1.5 bg-gray-100 rounded-md">
                                            Halaman {page} / {totalPages}
                                        </div>
                                        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                            Selanjutnya
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardBody>
            </Card>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                user={selectedUser}
                isLoading={isSubmitting}
                roleOptions={GURU_ROLE_OPTIONS}
            />
        </div>
    );
}

export default function GuruPage() {
    return (
        <DashboardLayout>
            <GuruListContent />
        </DashboardLayout>
    );
}
