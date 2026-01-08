'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AddBranchModal from '@/components/admin/AddBranchModal';

type Branch = {
    _id: string;
    name: string;
    email: string;
    password?: string;
    roles?: string[];
};

export default function AdminDashboard() {
    const [branches, setBranches] = useState<Branch[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check auth
    useEffect(() => {
        fetch('/api/auth/user')
            .then((res) => res.json())
            .then((data) => {
                if (!data.isLoggedIn || !data.isAdmin) {
                    router.push('/admin/login');
                } else {
                    setLoading(false);
                    fetchBranches();
                }
            })
            .catch(() => router.push('/admin/login'));
    }, [router]);

    const fetchBranches = async () => {
        const res = await fetch('/api/branches');
        if (res.ok) {
            const data = await res.json();
            setBranches(data);
        }
    };

    const handleSaveBranch = async (data: { name: string; email: string; password?: string; roles: string[] }) => {
        let res;
        if (editingBranch) {
            res = await fetch(`/api/branches/${editingBranch._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } else {
            res = await fetch('/api/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        }

        if (res.ok) {
            fetchBranches();
            setIsModalOpen(false);
            setEditingBranch(null);
        } else {
            alert('Failed to save branch (check if name/email already exists)');
            throw new Error('Failed to save');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this branch?')) return;

        const res = await fetch(`/api/branches/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            fetchBranches();
        } else {
            alert('Failed to delete branch');
        }
    };

    const openAddModal = () => {
        setEditingBranch(null);
        setIsModalOpen(true);
    };

    const openEditModal = (branch: Branch) => {
        setEditingBranch(branch);
        setIsModalOpen(true);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                    <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout
            title="Overview"
            actions={
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-500 hidden sm:inline">Admin</span>
                    <button
                        onClick={handleLogout}
                        className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                        Logout
                    </button>
                </div>
            }
        >
            {/* Stats Section */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-sm font-medium text-slate-500">Total Branches</h3>
                        <p className="mt-2 text-3xl font-bold text-slate-800">{branches.length}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                    </div>
                </div>
            </div>

            {/* Branch Management Section */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Your Branches</h3>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Branch
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {branches.map((branch) => (
                    <div key={branch._id} className="group relative rounded-xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all hover:border-blue-100">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">{branch.name}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-xs text-slate-500">Active</span>
                                        {branch.roles && branch.roles.map((role, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={() => openEditModal(branch)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(branch._id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <span className="truncate">{branch.email}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Card (Empty State) */}
                {branches.length === 0 && (
                    <div
                        onClick={openAddModal}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer h-full min-h-[160px]"
                    >
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <h4 className="font-semibold text-slate-600">Add First Branch</h4>
                        <p className="text-xs text-slate-500 mt-1">Create a new location to manage</p>
                    </div>
                )}
            </div>

            <AddBranchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveBranch}
                initialData={editingBranch ? {
                    name: editingBranch.name,
                    email: editingBranch.email,
                    roles: editingBranch.roles || []
                } : null}
                isEditing={!!editingBranch}
            />
        </AdminLayout>
    );
}
