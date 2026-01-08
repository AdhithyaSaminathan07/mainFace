'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon, PhoneIcon, IdentificationIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Member {
    _id: string;
    fullName: string;
    employeeId: string;
    phone: string;
    role: string;
    faceDescriptor: number[];
    images: string[];
    shiftId?: {
        name: string;
        startTime: string;
        endTime: string;
    };
    customStartTime?: string;
    customEndTime?: string;
}

export default function MembersContent() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState<any[]>([]);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        shiftId: '',
        customStartTime: '',
        customEndTime: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, shiftsRes] = await Promise.all([
                    fetch('/api/branch/members'),
                    fetch('/api/branch/shifts')
                ]);

                const membersData = await membersRes.json();
                const shiftsData = await shiftsRes.json();

                if (membersData.success) setMembers(membersData.members);
                if (shiftsData.success) setShifts(shiftsData.shifts);

            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const res = await fetch(`/api/branch/members?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                setMembers(prev => prev.filter(m => m._id !== id));
            } else {
                alert(data.error || 'Failed to delete member');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('An error occurred while deleting');
        }
    };

    const handleEditClick = (member: Member) => {
        setEditingMember(member);
        setEditFormData({
            shiftId: member.shiftId ? (member.shiftId as any)._id || member.shiftId : '', // Handle populated vs unpopulated
            customStartTime: member.customStartTime || '',
            customEndTime: member.customEndTime || '',
        });
        setIsEditModalOpen(true);
    };

    const handleEditShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedShiftId = e.target.value;
        const selectedShift = shifts.find(s => s._id === selectedShiftId);

        if (selectedShift) {
            setEditFormData({
                shiftId: selectedShiftId,
                customStartTime: selectedShift.startTime,
                customEndTime: selectedShift.endTime
            });
        } else {
            setEditFormData(prev => ({
                ...prev,
                shiftId: selectedShiftId,
                customStartTime: '',
                customEndTime: ''
            }));
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        try {
            const res = await fetch('/api/branch/members', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: editingMember._id,
                    ...editFormData,
                    fullName: editingMember.fullName, // Preserve other fields
                    phone: editingMember.phone,
                    role: editingMember.role,
                    employeeId: editingMember.employeeId
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Update local state
                setMembers(prev => prev.map(m => m._id === editingMember._id ? data.member : m));
                setIsEditModalOpen(false);
                setEditingMember(null);
                alert('Member updated successfully');
            } else {
                alert(data.error || 'Failed to update member');
            }
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update member');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                    <p className="text-sm text-gray-500">Manage and view all registered employees</p>
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-100">
                    Total: {members.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {members.map((member) => (
                    <div key={member._id} className="group bg-white rounded-xl border border-gray-100 hover:border-green-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    {member.images && member.images.length > 0 ? (
                                        <img
                                            src={member.images[0]}
                                            alt={member.fullName}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-gray-100"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center ring-1 ring-gray-100">
                                            <UserCircleIcon className="w-10 h-10 text-gray-300" />
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-white border border-gray-100 shadow-sm ${member.faceDescriptor ? 'text-green-500' : 'text-gray-300'
                                        }`}>
                                        {member.faceDescriptor ? (
                                            <CheckCircleIcon className="w-4 h-4" title="Face Enrolled" />
                                        ) : (
                                            <XCircleIcon className="w-4 h-4" title="Not Enrolled" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                            {member.fullName}
                                        </h3>
                                        <button
                                            onClick={() => handleEditClick(member)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Edit Shift"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                        <IdentificationIcon className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{member.employeeId} • {member.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{member.phone}</span>
                                    </div>
                                    {(member.shiftId || (member.customStartTime && member.customEndTime)) && (
                                        <div className="flex items-center gap-2 mt-1 text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            <span className="truncate font-medium">
                                                {member.shiftId?.name || 'Custom Shift'} (
                                                {member.customStartTime || member.shiftId?.startTime} - {member.customEndTime || member.shiftId?.endTime}
                                                )
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                            <span className="uppercase tracking-wider font-medium">Status</span>
                            <span className={`px-2 py-0.5 rounded-full ${member.faceDescriptor
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}>
                                {member.faceDescriptor ? 'Enrolled' : 'Pending Face'}
                            </span>
                            <button
                                onClick={() => handleDelete(member._id, member.fullName)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Member"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Edit Shift Allocation</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                <select
                                    className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none"
                                    value={editFormData.shiftId}
                                    onChange={handleEditShiftChange}
                                >
                                    <option value="">-- No Shift --</option>
                                    {shifts.map((shift) => (
                                        <option key={shift._id} value={shift._id}>
                                            {shift.name} ({shift.startTime} - {shift.endTime})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none"
                                        value={editFormData.customStartTime}
                                        onChange={(e) => setEditFormData({ ...editFormData, customStartTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none"
                                        value={editFormData.customEndTime}
                                        onChange={(e) => setEditFormData({ ...editFormData, customEndTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-600/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
