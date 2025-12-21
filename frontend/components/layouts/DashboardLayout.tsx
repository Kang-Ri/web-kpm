'use client';

import { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Topbar */}
            <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content with Sidebar */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 bg-gray-50">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}
