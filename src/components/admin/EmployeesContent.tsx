
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserCircleIcon, BuildingOfficeIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

type Employee = {
    _id: string;
    fullName: string;
    employeeId: string;
    branchName: string;
    status: 'Present' | 'Absent' | 'Late';
    checkInTime: string | null;
    avatar: string | null;
};

export default function EmployeesContent() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<{ _id: string, name: string }[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Authenticate and fetch
        const checkAuthAndFetch = async () => {
            try {
                const authRes = await fetch('/api/auth/user');
                const authData = await authRes.json();

                if (!authData.isLoggedIn || !authData.isAdmin) {
                    router.push('/admin/login');
                    return;
                }

                // Fetch branches
                const branchRes = await fetch('/api/branches');
                if (branchRes.ok) {
                    const branchData = await branchRes.json();
                    if (Array.isArray(branchData)) {
                        setBranches(branchData);
                    }
                }

                await fetchEmployees();
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, [router]);

    const fetchEmployees = async (branchId = selectedBranch) => {
        try {
            const query = branchId ? `?branchId=${branchId}` : '';
            const res = await fetch(`/api/admin/employees${query}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setEmployees(data.employees);
                }
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const handleBranchFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const branchId = e.target.value;
        setSelectedBranch(branchId);
        fetchEmployees(branchId);
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
                    <span>Loading employees...</span>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout
            title="All Employees"
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
            <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-semibold text-slate-800">Global Employee List</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedBranch}
                                onChange={handleBranchFilterChange}
                                className="appearance-none pl-9 pr-10 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-slate-600 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {employees.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <UserCircleIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p>No employees found in any branch.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Employee</th>
                                    <th className="px-6 py-4 font-semibold">Branch</th>
                                    <th className="px-6 py-4 font-semibold">Today's Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Check-In Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map((emp) => (
                                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {emp.avatar ? (
                                                    <img src={emp.avatar} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <UserCircleIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900">{emp.fullName}</p>
                                                    <p className="text-xs text-slate-500">ID: {emp.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
                                                {emp.branchName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${emp.status === 'Present'
                                                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                                : emp.status === 'Late'
                                                    ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                                                    : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                                            {emp.checkInTime ? new Date(emp.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
