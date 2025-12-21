'use client';

import { DashboardLayout } from '@/components/layouts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Eye, Edit, Trash2, Users, BookOpen, GraduationCap } from 'lucide-react';

export default function AdminDashboardPage() {
    // Sample stats
    const stats = [
        { label: 'Total Siswa', value: '245', icon: Users, color: 'bg-blue-100 text-blue-600' },
        { label: 'Total Kelas', value: '12', icon: BookOpen, color: 'bg-green-100 text-green-600' },
        { label: 'Total Materi', value: '48', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600' },
    ];

    const events = [
        {
            id: 1,
            name: 'KMNR 21',
            description: 'Kompetisi Matematika Nalaria Realistik',
            startDate: '8 Des 2025',
            endDate: '21 Des 2025',
            status: 'Active'
        },
        {
            id: 2,
            name: 'IKSC 2025',
            description: 'International Kangaroo Science Contest',
            startDate: '1 Nov 2025',
            endDate: '14 Des 2025',
            status: 'Active'
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                    <p className="text-gray-600 mt-1">Selamat datang di panel admin Web KPM</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <Card key={index} hover>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className={`w-14 h-14 rounded-lg ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="h-7 w-7" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Events Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
                            <Button variant="primary" icon={Plus}>
                                New Event
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nama Event</th>
                                        <th>Deskripsi</th>
                                        <th>Tanggal Mulai</th>
                                        <th>Tanggal Selesai</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <tr key={event.id}>
                                            <td className="font-medium text-gray-900">{event.name}</td>
                                            <td className="max-w-md truncate">{event.description}</td>
                                            <td>{event.startDate}</td>
                                            <td>{event.endDate}</td>
                                            <td>
                                                <Badge variant="success">{event.status}</Badge>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 hover:bg-gray-100 rounded transition">
                                                        <Eye className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded transition">
                                                        <Edit className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded transition">
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </DashboardLayout>
    );
}
