'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon, PhoneIcon, IdentificationIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Member {
    _id: string;
    fullName: string;
    employeeId: string;
    phone: string;
    role: string;
    faceDescriptor: number[];
    images: string[];
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('/api/branch/members');
                const data = await res.json();
                if (data.success) {
                    setMembers(data.members);
                }
            } catch (error) {
                console.error('Failed to load members', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

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
                                    <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                        {member.fullName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                        <IdentificationIcon className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{member.employeeId} • {member.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{member.phone}</span>
                                    </div>
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
