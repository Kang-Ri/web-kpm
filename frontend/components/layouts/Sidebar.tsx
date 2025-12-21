'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MenuItem } from '@/types';
import { menuItems, adminMenuItems } from '@/lib/menuConfig';
import { useAuthStore } from '@/lib/store/authStore';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    console.log('cek user => ', useAuthStore((state) => state));
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const toggleMenu = (label: string) => {
        setOpenMenus((prev) =>
            prev.includes(label)
                ? prev.filter((item) => item !== label)
                : [...prev, label]
        );
    };

    const isMenuOpen = (label: string) => openMenus.includes(label);
    const isActive = (href?: string) => href && pathname === href;

    // Check if user is on admin page
    const isAdminPage = pathname.startsWith('/admin');
    // TEMPORARY FIX: Check idRole (number) instead of role (string)
    // Admin roles: 1 = Super Admin, 2 = Admin, 3 = Guru, 4 = PJ
    const isAdmin = user && user.role === 'Admin';

    // Debug logging
    console.log('🔍 Sidebar Debug:', {
        pathname,
        isAdminPage,
        user: user ? { role: user.role, email: user.email } : null,
        isAdmin,
        shouldShowAdminMenu: isAdminPage && isAdmin
    });

    const renderMenuItem = (item: MenuItem, level = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const Icon = item.icon;
        const isOpened = isMenuOpen(item.label);

        // Check role-based visibility
        if (item.roles && user && !item.roles.includes(user.role)) {
            return null;
        }

        if (hasChildren) {
            return (
                <div key={item.label} className="mb-1">
                    <button
                        onClick={() => toggleMenu(item.label)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition ${level > 0 ? 'pl-8' : ''
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {Icon && <Icon className="h-5 w-5 text-gray-500" />}
                            <span className="font-medium">{item.label}</span>
                        </div>
                        {isOpened ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>

                    {/* Children */}
                    {isOpened && (
                        <div className="mt-1 ml-4">
                            {item.children!.map((child) => renderMenuItem(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <a
                key={item.label}
                href={item.href || '#'}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${level > 0 ? 'pl-8' : ''
                    } ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                onClick={onClose}
            >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{item.label}</span>
            </a>
        );
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="p-4">
                    {/* Conditional Menu Rendering */}
                    {isAdminPage && isAdmin ? (
                        <>
                            <div className="mb-2">
                                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Admin Panel
                                </p>
                            </div>
                            <nav className="space-y-1">
                                {adminMenuItems.map((item) => renderMenuItem(item))}
                            </nav>
                        </>
                    ) : (
                        <nav className="space-y-1">
                            {menuItems.map((item) => renderMenuItem(item))}
                        </nav>
                    )}
                </div>
            </aside>
        </>
    );
}
