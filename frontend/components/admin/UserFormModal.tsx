import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RoleOption {
    id: number;
    name: string;
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    user?: any | null;
    isLoading?: boolean;
    roleOptions: RoleOption[];
}

export function UserFormModal({ isOpen, onClose, onSubmit, user, isLoading, roleOptions }: UserFormModalProps) {
    const [namaLengkap, setNamaLengkap] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [idRole, setIdRole] = useState<number | ''>('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setNamaLengkap(user.namaLengkap || '');
            setEmail(user.email || '');
            setIdRole(user.role?.idRole || user.idRole || '');
            setPassword(''); // Never pre-fill password
        } else {
            setNamaLengkap('');
            setEmail('');
            setPassword('');
            setIdRole(roleOptions.length === 1 ? roleOptions[0].id : '');
        }
    }, [user, isOpen, roleOptions]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const data: any = {
            namaLengkap,
            email,
            idRole: Number(idRole),
        };

        if (password) {
            data.password = password;
        }

        await onSubmit(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-lg relative shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {user ? 'Edit Data' : 'Tambah Data'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap *
                            </label>
                            <input
                                type="text"
                                value={namaLengkap}
                                onChange={(e) => setNamaLengkap(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role *
                            </label>
                            <select
                                value={idRole}
                                onChange={(e) => setIdRole(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="" disabled>Pilih Role</option>
                                {roleOptions.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password {user ? '(Opsional)' : '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                    required={!user}
                                    placeholder={user ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password baru'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        form="user-form"
                        variant="primary"
                        icon={Save}
                        isLoading={isLoading}
                    >
                        Simpan
                    </Button>
                </div>
            </div>
        </div>
    );
}
