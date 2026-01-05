'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Branch = {
    _id: string;
    name: string;
    email?: string;
    password?: string;
};

export default function AdminDashboard() {
    const [branches, setBranches] = useState<Branch[]>([]);

    // Form State
    const [newBranch, setNewBranch] = useState('');
    const [newBranchEmail, setNewBranchEmail] = useState('');
    const [newBranchPassword, setNewBranchPassword] = useState('');

    // UI State
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBranch || !newBranchEmail || !newBranchPassword) return;

        const payload = {
            name: newBranch,
            email: newBranchEmail,
            password: newBranchPassword
        };

        let res;
        if (editingId) {
            // Update existing
            res = await fetch(`/api/branches/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            // Create new
            res = await fetch('/api/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (res.ok) {
            resetForm();
            fetchBranches();
        } else {
            alert('Failed to save branch (duplicate name/email?)');
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

    const startEdit = (branch: Branch) => {
        setEditingId(branch._id);
        setNewBranch(branch.name);
        setNewBranchEmail(branch.email || '');
        setNewBranchPassword(branch.password || ''); // Note: Password might not be returned in real app for security, but here we likely don't have it or it's hashed. 
        // If password is not returned, the user might need to enter a new one to update it.
        // For this simple app, we assume we might overwrite it.
    };

    const resetForm = () => {
        setEditingId(null);
        setNewBranch('');
        setNewBranchEmail('');
        setNewBranchPassword('');
        setShowPassword(false);
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
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-10 h-full w-64 bg-[#1a1f37] text-white transition-all">
                <div className="flex h-16 items-center border-b border-white/10 px-6 font-bold text-lg tracking-wide">
                    Face Admin
                </div>
                <nav className="p-4 space-y-2">
                    <a href="#" className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        Dashboard
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1">
                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white/80 px-8 shadow-sm backdrop-blur-md">
                    <h2 className="text-xl font-bold text-slate-800">Overview</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-500">Admin</span>
                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    {/* Stats Section Placeholder */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-medium text-slate-500">Total Branches</h3>
                            <p className="mt-2 text-3xl font-bold text-slate-800">{branches.length}</p>
                        </div>
                    </div>

                    {/* Branch Management Section */}
                    <section className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-slate-800">
                                {editingId ? 'Edit Branch' : 'Add New Branch'}
                            </h3>
                            {editingId && (
                                <button onClick={resetForm} className="text-xs text-slate-500 underline">Cancel Edit</button>
                            )}
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Branch Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Downtown"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={newBranch}
                                        onChange={(e) => setNewBranch(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="branch@example.com"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={newBranchEmail}
                                        onChange={(e) => setNewBranchEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={newBranchPassword}
                                        onChange={(e) => setNewBranchPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${editingId ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-500/20'}`}
                                >
                                    {editingId ? 'Update Branch' : 'Add Branch'}
                                </button>
                            </form>

                            <div className="rounded-lg border border-slate-100">
                                <div className="bg-slate-50/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 grid grid-cols-12 gap-4">
                                    <div className="col-span-4">Branch Name</div>
                                    <div className="col-span-5">Email</div>
                                    <div className="col-span-3 text-right">Actions</div>
                                </div>
                                {branches.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No branches found. Add one to get started.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {branches.map((branch) => (
                                            <li key={branch._id} className="group grid grid-cols-12 gap-4 items-center px-6 py-4 transition-colors hover:bg-slate-50">
                                                <div className="col-span-4 font-medium text-slate-700 group-hover:text-slate-900">{branch.name}</div>
                                                <div className="col-span-5 text-sm text-slate-500">{branch.email}</div>
                                                <div className="col-span-3 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(branch)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(branch._id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
