'use client';

import { useEffect, useState } from 'react';
import FaceCamera from '@/components/FaceCamera';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { CheckCircleIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

interface Member {
    _id: string;
    fullName: string;
    employeeId: string;
    role: string;
    faceDescriptor: number[];
}

export default function AttendanceScanPage() {
    const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastScan, setLastScan] = useState<{ name: string; time: Date; type: string } | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/branch/members');
            const data = await res.json();
            if (data.success) {
                const members: Member[] = data.members;
                const descriptors = members
                    .filter(m => m.faceDescriptor && m.faceDescriptor.length > 0)
                    .map(member => {
                        return new faceapi.LabeledFaceDescriptors(
                            `${member.fullName} (${member.employeeId})::${member._id}`,
                            [new Float32Array(member.faceDescriptor)]
                        );
                    });
                setLabeledDescriptors(descriptors);
            }
        } catch (error) {
            console.error('Failed to load members', error);
            toast.error('Failed to load member data');
        } finally {
            setLoading(false);
        }
    };

    const handleFaceMatch = async (match: faceapi.FaceMatch) => {
        if (match.label === 'unknown') return;

        const parts = match.label.split('::');
        const dbId = parts[1];
        const nameDisplay = parts[0];

        if (!dbId) return;

        const now = new Date();
        // Prevent duplicate spam (5 second local cooldown)
        if (lastScan && lastScan.name === nameDisplay && (now.getTime() - lastScan.time.getTime()) < 5000) {
            return;
        }

        try {
            const res = await fetch('/api/branch/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: dbId,
                    confidence: 1 - match.distance,
                }),
            });
            const data = await res.json();

            if (data.success) {
                const type = data.type; // 'IN' or 'OUT'
                setLastScan({ name: nameDisplay, time: now, type });

                // Show Toast
                if (type === 'IN') {
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-green-500`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <ArrowRightOnRectangleIcon className="h-10 w-10 text-green-500" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-900">Welcome!</p>
                                        <p className="mt-1 text-sm text-gray-500">Checked IN: {nameDisplay}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), { duration: 3000 });
                } else {
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-orange-500`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <ArrowLeftOnRectangleIcon className="h-10 w-10 text-orange-500" />
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-900">Goodbye!</p>
                                        <p className="mt-1 text-sm text-gray-500">Checked OUT: {nameDisplay}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), { duration: 3000 });
                }

                const audio = new Audio('/sounds/success.mp3');
                audio.play().catch(() => { });
            } else {
                if (data.message) toast.error(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                Loading Scanner...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6 flex flex-col items-center">
            <div className="w-full max-w-5xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance Scanner</h1>
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <p>System Online • Looking for faces</p>
                    </div>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-50 border border-gray-200 ring-1 ring-gray-100">
                    <FaceCamera
                        mode="scan"
                        labeledDescriptors={labeledDescriptors}
                        onFaceMatch={handleFaceMatch}
                    />

                    {/* HUD Overlay - Top Right */}
                    <div className="absolute top-6 right-6 flex flex-col items-end gap-2 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Employees</p>
                                <p className="text-lg font-bold text-gray-900 leading-none">{labeledDescriptors.length}</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-md text-green-600">
                                <CheckCircleIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Instructions */}
                <div className="flex justify-center gap-8">
                    <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-5 py-3 rounded-full border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 text-green-600 shadow-sm">
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        </div>
                        <span>Look at camera to <strong>Check IN</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-5 py-3 rounded-full border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 text-orange-500 shadow-sm">
                            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                        </div>
                        <span>Look again to <strong>Check OUT</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
