'use client';

import { useEffect, useState } from 'react';
import FaceCamera from '@/components/FaceCamera';
import * as faceapi from 'face-api.js';

interface Member {
    _id: string;
    fullName: string;
    employeeId: string;
    role: string;
    faceDescriptor: number[];
}

export default function AttendanceScanPage() { // Renamed for clarity in this file, file name is page.tsx
    const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAttendance, setLastAttendance] = useState<{ name: string; time: Date } | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/branch/members');
            const data = await res.json();
            if (data.success) {
                const members: Member[] = data.members;
                const descriptors = members.map(member => {
                    return new faceapi.LabeledFaceDescriptors(
                        `${member.fullName} (${member.employeeId})::${member._id}`, // Encoding ID in label for processing
                        [new Float32Array(member.faceDescriptor)]
                    );
                });
                setLabeledDescriptors(descriptors);
            }
        } catch (error) {
            console.error('Failed to load members', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFaceMatch = async (match: faceapi.FaceMatch) => {
        if (match.label === 'unknown') return;

        // Extract ID from label format "Name (ID)::DB_ID"
        const parts = match.label.split('::');
        const dbId = parts[1];
        const nameDisplay = parts[0];

        if (!dbId) return;

        const now = new Date();
        // Prevent duplicate spam
        if (lastAttendance && lastAttendance.name === nameDisplay && (now.getTime() - lastAttendance.time.getTime()) < 5000) {
            return;
        }

        console.log(`Matched: ${nameDisplay} with distance ${match.distance}`);

        // Log attendance
        try {
            const res = await fetch('/api/branch/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: dbId,
                    confidence: 1 - match.distance, // distance 0 is best match
                    status: 'Present'
                }),
            });
            const data = await res.json();

            if (data.success) {
                // Show success
                setLastAttendance({ name: nameDisplay, time: now });
                const audio = new Audio('/sounds/success.mp3'); // Optional: Sound
                audio.play().catch(() => { }); // catch if no file
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Members...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance Scanner</h1>
                    <p className="text-gray-500 mt-2">Please look at the camera to mark your attendance.</p>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-gray-200">
                    <FaceCamera
                        mode="scan"
                        labeledDescriptors={labeledDescriptors}
                        onFaceMatch={handleFaceMatch}
                    />

                    {/* Success Overlay */}
                    {lastAttendance && (
                        <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-lg animate-fade-in-down flex items-center gap-3">
                            <div className="bg-white text-green-600 rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Marked!</p>
                                <p className="text-sm opacity-90">{lastAttendance.name}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center text-gray-400 text-sm">
                    <p>Powered by AI Face Recognition</p>
                </div>
            </div>
        </div>
    );
}
