'use client';

import { Home, BookOpen, Trophy, ShoppingBag, Zap, Handshake, Users, GraduationCap } from 'lucide-react';
import { MenuItem } from '@/types';

export const menuItems: MenuItem[] = [
    {
        label: 'Home',
        icon: Home,
        children: [
            { label: 'Seperti', href: '/tentang' },
            { label: 'Kelas Periodik', href: '/kelas/periodik' },
            { label: 'Kelas Insidental', href: '/kelas/insidental' },
            { label: 'Produk', href: '/produk' },
        ],
    },
    {
        label: 'Pendidikan & Pelatihan',
        icon: BookOpen,
        children: [
            { label: 'Pelatihan & Pembinaan Siswa', href: '/pelatihan/siswa' },
            { label: 'Pelatihan Guru & Sekolah', href: '/pelatihan/guru' },
            { label: 'Pelatihan Orang Tua', href: '/pelatihan/ortu' },
        ],
    },
    {
        label: 'Lomba',
        icon: Trophy,
        children: [
            { label: 'Regional', href: '/lomba/regional' },
            { label: 'Nasional', href: '/lomba/nasional' },
            { label: 'Internasional', href: '/lomba/internasional' },
        ],
    },
    {
        label: 'Produk',
        icon: ShoppingBag,
        children: [
            { label: 'Produk Fisik', href: '/produk/fisik' },
            { label: 'Produk Digital', href: '/produk/digital' },
        ],
    },
    {
        label: 'Suprarasional',
        icon: Zap,
        href: '/suprarasional',
    },
    {
        label: 'Kerjasama',
        icon: Handshake,
        href: '/kerjasama',
    },
];

// Admin-only menu items
export const adminMenuItems: MenuItem[] = [
    {
        label: 'Home',
        icon: Home,
        href: '/admin/dashboard',
    },
    {
        label: 'Data User',
        icon: Users,
        children: [
            { label: 'Data Admin', href: '/admin/data-user/admin' },
            { label: 'Data Guru', href: '/admin/data-user/guru' },
            { label: 'Data Siswa', href: '/admin/siswa' }, // Existing path
        ],
    },
    {
        label: 'Daftar Kelas',
        icon: GraduationCap,
        children: [
            { label: 'Kelas Periodik', href: '/admin/kelas/periodik' },
            { label: 'Kelas Insidental', href: '/admin/kelas/insidental' },
        ],
    },
    {
        label: 'Manajemen Produk',
        icon: ShoppingBag,
        children: [
            { label: 'Produk Fisik', href: '/admin/produk/fisik' },
            { label: 'Produk Digital', href: '/admin/produk/digital' },
        ],
    },
    {
        label: 'Lomba',
        icon: Trophy,
        children: [
            { label: 'Regional', href: '/admin/lomba/regional' },
            { label: 'Nasional', href: '/admin/lomba/nasional' },
            { label: 'Internasional', href: '/admin/lomba/internasional' },
        ],
    },
];
