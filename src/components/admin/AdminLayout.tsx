
'use client';

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, actions }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
                {/* Mobile Header / Top Bar */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white/80 px-4 sm:px-8 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        {title && <h2 className="text-xl font-bold text-slate-800 truncate">{title}</h2>}
                    </div>

                    <div className="flex items-center gap-4">
                        {actions}
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
