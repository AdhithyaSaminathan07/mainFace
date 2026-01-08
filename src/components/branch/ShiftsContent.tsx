'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { UsersIcon } from '@heroicons/react/24/outline';

interface Shift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    members?: Member[];
}

interface Member {
    _id: string;
    fullName: string;
    shiftId?: string | { _id: string }; // Handle populated/unpopulated
}

export default function ShiftsContent() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignShift, setAssignShift] = useState<Shift | null>(null);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [loadingMembers, setLoadingMembers] = useState(false);

    const fetchShifts = async () => {
        try {
            const res = await fetch('/api/branch/shifts');
            const data = await res.json();
            if (data.success) {
                setShifts(data.shifts);
            } else {
                toast.error(data.error || 'Failed to fetch shifts');
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
            toast.error('Failed to load shifts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const resetForm = () => {
        setName('');
        setStartTime('');
        setEndTime('');
        setEditingShift(null);
    };

    const handleOpenModal = (shift?: Shift) => {
        if (shift) {
            setEditingShift(shift);
            setName(shift.name);
            setStartTime(shift.startTime);
            setEndTime(shift.endTime);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingShift
                ? `/api/branch/shifts/${editingShift._id}`
                : '/api/branch/shifts';
            const method = editingShift ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, startTime, endTime }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(data.message);
                fetchShifts();
                handleCloseModal();
            } else {
                toast.error(data.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving shift:', error);
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) return;

        try {
            const res = await fetch(`/api/branch/shifts/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                toast.success(data.message);
                fetchShifts();
            } else {
                toast.error(data.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting shift:', error);
            toast.error('Failed to delete shift');
        }
    };

    // Bulk Assignment Logic
    const handleOpenAssignModal = async (shift: Shift) => {
        setAssignShift(shift);
        setIsAssignModalOpen(true);
        setLoadingMembers(true);

        try {
            const res = await fetch('/api/branch/members');
            const data = await res.json();
            if (data.success) {
                setAllMembers(data.members);
                // Pre-select members who are already assigned to this shift
                const shiftMemberIds = data.members
                    .filter((m: any) => {
                        // Handle populated or unpopulated shiftId
                        const mShiftId = m.shiftId && typeof m.shiftId === 'object' ? m.shiftId._id : m.shiftId;
                        return mShiftId === shift._id;
                    })
                    .map((m: any) => m._id);
                setSelectedMemberIds(new Set(shiftMemberIds));
            }
        } catch (error) {
            console.error('Failed to load members', error);
            toast.error('Failed to load members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const toggleMemberSelection = (memberId: string) => {
        const newSelected = new Set(selectedMemberIds);
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId);
        } else {
            newSelected.add(memberId);
        }
        setSelectedMemberIds(newSelected);
    };

    const handleSaveAssignments = async () => {
        if (!assignShift) return;
        setSubmitting(true);

        try {
            const res = await fetch('/api/branch/members/assign-shift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shiftId: assignShift._id,
                    memberIds: Array.from(selectedMemberIds)
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`Members assigned to ${assignShift.name}`);
                setIsAssignModalOpen(false);
                setAssignShift(null);
            } else {
                toast.error(data.error || 'Assignment failed');
            }
        } catch (error) {
            console.error('Error assigning members:', error);
            toast.error('Failed to assign members');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <Toaster position="top-right" />
            <div className="flex justify-between items-center mb-6">
                {/* ... Header content ... */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
                    <p className="text-gray-500">Create and manage employee shifts</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add New Shift
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : shifts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    {/* ... Empty state ... */}
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Shifts Found</h3>
                    <p className="text-gray-500 text-sm mb-6">Get started by creating your first shift schedule.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                    >
                        Create Shift
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shifts.map((shift) => (
                        <div key={shift._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group relative flex flex-col h-full">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => handleOpenAssignModal(shift)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Assign Members"
                                >
                                    <UsersIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleOpenModal(shift)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(shift._id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{shift.name}</h3>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    <span>{shift.startTime} - {shift.endTime}</span>
                                </div>
                            </div>

                            {/* Assigned Members Preview */}
                            <div className="mt-auto">
                                <div className="flex -space-x-2 overflow-hidden mb-2">
                                    {shift.members && shift.members.length > 0 ? (
                                        shift.members.slice(0, 5).map((member) => (
                                            <div key={member._id} className="relative inline-block h-8 w-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600" title={member.fullName}>
                                                {member.fullName.charAt(0)}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400 italic pl-1">No members assigned</span>
                                    )}
                                    {shift.members && shift.members.length > 5 && (
                                        <div className="relative inline-block h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                                            +{shift.members.length - 5}
                                        </div>
                                    )}
                                </div>
                                {shift.members && shift.members.length > 0 && (
                                    <p className="text-xs text-gray-500">{shift.members.length} employees</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* ... Existing Modal Content ... */}
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingShift ? 'Edit Shift' : 'Add New Shift'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* ... Form Fields ... */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Morning Shift"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? 'Saving...' : (editingShift ? 'Save Changes' : 'Create Shift')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Members Modal */}
            {isAssignModalOpen && assignShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Manage Members</h3>
                                <p className="text-xs text-gray-500">Assign members to <strong>{assignShift.name}</strong></p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingMembers ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                </div>
                            ) : allMembers.length === 0 ? (
                                <p className="text-center text-gray-500">No members found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {allMembers.map(member => (
                                        <label key={member._id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMemberIds.has(member._id)
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 bg-white'
                                                }`}>
                                                {selectedMemberIds.has(member._id) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedMemberIds.has(member._id)}
                                                onChange={() => toggleMemberSelection(member._id)}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{member.fullName}</p>
                                                {/* Show current shift if assigned to DIFFERENT shift */}
                                                {member.shiftId
                                                    && (typeof member.shiftId === 'object' ? member.shiftId._id : member.shiftId) !== assignShift._id
                                                    && (
                                                        <p className="text-xs text-orange-500">
                                                            Currently in: {typeof member.shiftId === 'object' ? (member.shiftId as any).name : 'Another Shift'}
                                                        </p>
                                                    )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAssignments}
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm shadow-green-600/20 disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : `Assign ${selectedMemberIds.size} Members`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
