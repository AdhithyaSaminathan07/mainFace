'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import FaceScanModal from '@/components/FaceScanModal';
import * as faceapi from 'face-api.js';
import toast, { Toaster } from 'react-hot-toast';
import { ViewfinderCircleIcon } from '@heroicons/react/24/outline';

interface Member {
    _id: string;
    fullName: string;
    faceDescriptor: number[];
}

export default function DashboardContent() {
    const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const processingMatchRef = useRef(false);

    // Mock activities
    const [activities, setActivities] = useState([
        { id: 1, text: 'System started', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('/api/branch/members');
                const data = await res.json();
                if (data.success && data.members) {
                    const descriptors = data.members
                        .filter((m: Member) => m.faceDescriptor && m.faceDescriptor.length > 0)
                        .map((m: Member) => {
                            return new faceapi.LabeledFaceDescriptors(
                                `${m.fullName} (${m._id})`,
                                [new Float32Array(m.faceDescriptor)]
                            );
                        });
                    setLabeledDescriptors(descriptors);
                }
            } catch (error) {
                console.error('Failed to load members for face recognition', error);
                toast.error('Failed to load facial data');
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const handleFaceMatch = useCallback(async (bestMatch: faceapi.FaceMatch) => {
        if (processingMatchRef.current || bestMatch.label === 'unknown') return;
        processingMatchRef.current = true;

        try {
            const match = bestMatch.label.match(/\((.*?)\)$/);
            if (!match) return;
            const memberId = match[1];

            const res = await fetch('/api/branch/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId,
                    confidence: bestMatch.distance,
                    status: 'Present'
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success(data.message);
                setActivities(prev => [{
                    id: Date.now(),
                    text: data.message,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }, ...prev.slice(0, 9)]);

                setTimeout(() => {
                    setIsScannerOpen(false);
                }, 1500);

            } else {
                if (data.message) {
                    toast(data.message, { icon: 'ℹ️' });
                } else {
                    toast.error(data.error || 'Attendance failed');
                }
            }

        } catch (error) {
            console.error('Attendance error:', error);
            toast.error('Error marking attendance');
        } finally {
            setTimeout(() => {
                processingMatchRef.current = false;
            }, 3000);
        }
    }, []);

    return (
        <div className="h-[calc(100vh-8rem)]">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

            <FaceScanModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onFaceMatch={handleFaceMatch}
                labeledDescriptors={labeledDescriptors}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Action Tag */}
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                                <ViewfinderCircleIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold">Face Recognition</h3>
                                <p className="text-blue-100 text-sm">Tap to mark attendance</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
                            {loading ? 'Loading models...' : 'Ready to scan'}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </button>

                    {/* Dashboard Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-sm">Present Today</p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">0</h4>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-sm">Late Arrivals</p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">0</h4>
                        </div>
                    </div>
                </div>

                {/* Right Column - Recent Activity */}
                <div className="lg:col-span-1 h-full overflow-hidden">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 h-full flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            Recent Activity
                        </h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-100/50 hover:bg-gray-100 transition-colors group">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                        {activity.text.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 leading-snug">{activity.text}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">View All History</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
