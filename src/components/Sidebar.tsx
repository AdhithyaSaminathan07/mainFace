'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserPlusIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const navItems = [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Add Attendance', href: '/attendance', icon: UserPlusIcon },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-gray-900"
            >
                {isOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                ) : (
                    <Bars3Icon className="w-6 h-6" />
                )}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto z-40
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
                            F
                        </span>
                        Face App
                    </h1>
                </div>

                <nav className="px-4 space-y-1 mt-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon
                                    className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
