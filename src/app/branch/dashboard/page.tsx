'use client';

import { useState, useRef, useEffect } from 'react';

export default function BranchDashboard() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [error, setError] = useState('');

    // Mock activities
    const activities = [
        { id: 1, text: 'Member #1234 verified', time: '10:42 AM' },
        { id: 2, text: 'Member #5678 verified', time: '10:30 AM' },
        { id: 3, text: 'Unknown face detected', time: '10:15 AM' },
        { id: 4, text: 'System started', time: '09:00 AM' },
        { id: 5, text: 'Admin logged in', time: '08:55 AM' },
    ];

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                setError('');
            }
        } catch (err) {
            setError('Unable to access camera. Please ensure permissions are granted.');
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* Main Column - Face Recognition Camera */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 flex-1 flex flex-col overflow-hidden relative">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Face Recognition</h2>
                        <div className="flex gap-2">
                            {isCameraActive ? (
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Live
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                                    Offline
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100 items-center justify-center flex shadow-inner">
                        {error ? (
                            <p className="text-red-500 text-sm p-4 text-center">{error}</p>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay Scan UI */}
                                {isCameraActive && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400 -mt-0.5 -ml-0.5"></div>
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400 -mt-0.5 -mr-0.5"></div>
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400 -mb-0.5 -ml-0.5"></div>
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400 -mb-0.5 -mr-0.5"></div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 text-xs font-medium tracking-widest uppercase">Scanning...</div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mt-4 flex gap-3 justify-center">
                        {!isCameraActive && (
                            <button
                                onClick={startCamera}
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Start Camera
                            </button>
                        )}
                        {isCameraActive && (
                            <button
                                onClick={stopCamera}
                                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Stop Camera
                            </button>
                        )}
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
    );
}
