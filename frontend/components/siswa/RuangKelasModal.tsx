'use client';

import { FC, useEffect, useState } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { RuangKelasCard } from './RuangKelasCard';
import { DaftarUlangFormModal } from './DaftarUlangFormModal';
import { PaymentStatusModal } from './PaymentStatusModal';
import { ProfileCompletionModal } from './ProfileCompletionModal';
import { siswaService } from '@/lib/api/siswa.service';
import { toast } from 'react-hot-toast';

interface RuangKelasModalProps {
    isOpen: boolean;
    onClose: () => void;
    idSiswa: number;
    idParent1: number;
    namaParent1: string;
    onSuccess?: () => void;
}

interface RuangKelasData {
    parent1: {
        idParent1: number;
        namaParent1: string;
        descParent1?: string;
    };
    ruangKelas: any[];
}

// Enrollment state machine
type EnrollStep = 'idle' | 'enrolling' | 'profile' | 'form' | 'payment' | 'done';

interface EnrollmentState {
    idSiswaKelas: number | null;
    idForm: number | null;
    hasForm: boolean;
    needsProfileCompletion: boolean;
    siswaProfile: Record<string, string>;
    kategoriHarga: string;
    hargaDaftarUlang: number;
    namaKelas: string;
    idParent2: number | null;
    orderData: any | null;
    directlyActive: boolean;
    statusEnrollment: string | null;
}

export const RuangKelasModal: FC<RuangKelasModalProps> = ({
    isOpen,
    onClose,
    idSiswa,
    idParent1,
    namaParent1,
    onSuccess
}) => {
    const [data, setData] = useState<RuangKelasData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<number | null>(null);

    // Enrollment flow state machine
    const [enrollStep, setEnrollStep] = useState<EnrollStep>('idle');
    const [enrollState, setEnrollState] = useState<EnrollmentState>({
        idSiswaKelas: null,
        idForm: null,
        hasForm: false,
        needsProfileCompletion: false,
        siswaProfile: {},
        kategoriHarga: 'Gratis',
        hargaDaftarUlang: 0,
        namaKelas: '',
        idParent2: null,
        orderData: null,
        directlyActive: false,
        statusEnrollment: null,
    });

    useEffect(() => {
        if (isOpen && idSiswa && idParent1) {
            fetchRuangKelas();
        }
    }, [isOpen, idSiswa, idParent1]);

    const fetchRuangKelas = async () => {
        try {
            setIsLoading(true);
            const response = await siswaService.getParent2List(idSiswa, idParent1);
            setData(response.data.data);
        } catch (error: any) {
            console.error('Error fetching ruang kelas:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat daftar ruang kelas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async (idParent2: number) => {
        try {
            setEnrollingId(idParent2);

            // Step 1: Call enroll endpoint
            const response = await siswaService.enroll(idSiswa, idParent2);
            const enrollResult = response.data?.data;

            if (!enrollResult) {
                toast.error('Terjadi kesalahan saat mendaftar.');
                return;
            }

            const namaKelas = enrollResult.ruangKelas?.namaParent2 || namaParent1;

            // Update base enrollment state
            const newState: EnrollmentState = {
                idSiswaKelas: enrollResult.idSiswaKelas,
                idForm: enrollResult.idForm,
                hasForm: enrollResult.hasForm,
                needsProfileCompletion: enrollResult.needsProfileCompletion,
                siswaProfile: enrollResult.siswaProfile || {},
                kategoriHarga: enrollResult.kategoriHarga || 'Gratis',
                hargaDaftarUlang: enrollResult.hargaDaftarUlang || 0,
                namaKelas,
                idParent2,
                orderData: null,
                directlyActive: enrollResult.directlyActive,
                statusEnrollment: enrollResult.statusEnrollment,
            };
            setEnrollState(newState);

            // Special Case: Resume enrollment if order data exists
            if (enrollResult.orderData) {
                console.log('🔄 Resume detected, attaching order data:', enrollResult.orderData);
                setEnrollState(prev => ({ 
                    ...prev, 
                    orderData: enrollResult.orderData,
                    statusEnrollment: enrollResult.statusEnrollment || prev.statusEnrollment 
                }));
            }

            // Step 2: Determine next step
            if (enrollResult.directlyActive) {
                // Gratis + no form + complete profile → directly active!
                toast.success(enrollResult.message || 'Pendaftaran berhasil!');
                await fetchRuangKelas(); // refresh cards
                return;
            }

            if (enrollResult.needsProfileCompletion) {
                // Profile incomplete → show ProfileCompletionModal first
                setEnrollStep('profile');
                return;
            }

            if (enrollResult.hasForm && enrollResult.idForm) {
                // Has form → show DaftarUlangFormModal
                setEnrollStep('form');
                return;
            }

            // No form, but requires payment check (for Seikhlasnya/Bernominal)
            if (!enrollResult.hasForm && (enrollResult.requiresPayment || enrollResult.kategoriHarga === 'Seikhlasnya')) {
                console.log('💳 Jumping directly to payment step...');
                setEnrollStep('payment');
                return;
            }

            // If it's Gratis and no form, it usually handles directlyActive case above.
            // If we reach here, default to payment modal as safety.
            setEnrollStep('payment');

        } catch (error: any) {
            console.error('Error enrolling:', error);
            const errorMessage = error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.';
            toast.error(errorMessage);
        } finally {
            setEnrollingId(null);
        }
    };

    // After profile completion, re-check enrollment flow
    const handleProfileComplete = async (profileData: any) => {
        try {
            await siswaService.completeProfile(idSiswa, profileData);
            toast.success('Profil berhasil dilengkapi!');
            setEnrollStep('idle');

            // Re-enroll with the same parent2 to continue the flow
            if (enrollState.idParent2) {
                setTimeout(() => {
                    handleEnroll(enrollState.idParent2!);
                }, 500);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan profil.');
        }
    };

    // After form is submitted
    const handleFormSubmitted = (orderResult: any) => {
        console.log('📝 Form Submitted, Order Result:', orderResult);
        setEnrollState(prev => ({ ...prev, orderData: orderResult }));

        if (!orderResult.needsPayment) {
            // Free → enrollment already activated by backend
            toast.success('Pendaftaran berhasil dan sudah aktif!');
            setEnrollStep('done');
            fetchRuangKelas();
            onSuccess?.(); // Trigger dashboard refresh
            setTimeout(onClose, 2000);
        } else {
            // Needs payment
            setEnrollStep('payment');
        }
    };

    // After payment success
    const handlePaymentSuccess = () => {
        setEnrollStep('done');
        fetchRuangKelas();
        onSuccess?.(); // Trigger dashboard refresh
        toast.success('Pendaftaran aktif! Selamat bergabung!');
        setTimeout(onClose, 2000);
    };

    const handleCloseSubModal = () => {
        setEnrollStep('idle');
        setEnrollState(prev => ({ ...prev, orderData: null }));
        fetchRuangKelas();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Ruang Kelas Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{namaParent1}</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Pilih ruang kelas yang sesuai dengan jadwal Anda
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : data && data.ruangKelas.length > 0 ? (
                            <>
                                {data.parent1.descParent1 && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                                        <p className="text-sm text-blue-800">{data.parent1.descParent1}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.ruangKelas.map((kelas) => (
                                        <RuangKelasCard
                                            key={kelas.idParent2}
                                            ruangKelas={kelas}
                                            onEnroll={handleEnroll}
                                            isLoading={enrollingId === kelas.idParent2}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Info className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Tidak Ada Ruang Kelas Tersedia
                                </h3>
                                <p className="text-gray-600">
                                    Belum ada ruang kelas yang dibuka untuk kelas Anda saat ini.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub-modals (rendered on top of main modal) */}

            {/* Profile Completion Modal */}
            {enrollStep === 'profile' && (
                <ProfileCompletionModal
                    isOpen={true}
                    siswaName={enrollState.siswaProfile.namaLengkap || ''}
                    initialData={enrollState.siswaProfile}
                    onComplete={handleProfileComplete}
                    isLoading={false}
                />
            )}

            {/* Daftar Ulang Form Modal */}
            {enrollStep === 'form' && enrollState.idForm && enrollState.idSiswaKelas && (
                <DaftarUlangFormModal
                    isOpen={true}
                    onClose={handleCloseSubModal}
                    idForm={enrollState.idForm}
                    idSiswaKelas={enrollState.idSiswaKelas}
                    namaKelas={enrollState.namaKelas}
                    siswaProfile={enrollState.siswaProfile}
                    onSubmitted={handleFormSubmitted}
                />
            )}

            {/* Payment Status Modal */}
            {enrollStep === 'payment' && (
                <PaymentStatusModal
                    isOpen={true}
                    onClose={handleCloseSubModal}
                    orderData={enrollState.orderData}
                    enrollmentInfo={{
                        namaKelas: enrollState.namaKelas,
                        kategoriHarga: enrollState.kategoriHarga as any,
                        hargaDaftarUlang: enrollState.hargaDaftarUlang,
                        statusEnrollment: enrollState.statusEnrollment || 'Pending',
                    }}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
};
