'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function ReportsContent() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/branch/attendance?date=${date}`);
                const data = await res.json();
                if (data.success) {
                    setRecords(data.records);
                } else {
                    toast.error(data.error || 'Failed to fetch reports');
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
                toast.error('Failed to load reports');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [date]);

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Select Date:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No attendance records found for this date.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{record.memberId?.fullName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{record.memberId?.employeeId || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.type === 'IN'
                                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                                                }`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.status === 'Late'
                                                    ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                    : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
