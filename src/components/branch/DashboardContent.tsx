'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import FaceScanModal from '@/components/FaceScanModal';
import * as faceapi from 'face-api.js';
import toast, { Toaster } from 'react-hot-toast';
import { ViewfinderCircleIcon } from '@heroicons/react/24/outline';
import { useFaceApi } from '@/context/FaceApiContext';

interface Member {
    _id: string;
    fullName: string;
    faceDescriptor: number[];
}

export default function DashboardContent() {
    const { isModelsLoaded } = useFaceApi();
    const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const processingMatchRef = useRef(false);

    // Mock activities
    const [activities, setActivities] = useState([
        { id: 1, text: 'System started', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    const [stats, setStats] = useState({ present: 0, late: 0 });

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/attendance');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('/api/attendance?action=members');
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
        fetchStats();
    }, []);

    const [locationStatus, setLocationStatus] = useState<'loading' | 'allowed' | 'denied' | 'out-of-range' | 'error'>('loading');
    const [distance, setDistance] = useState<number | null>(null);
    const [branchLocation, setBranchLocation] = useState<{ lat: number, lng: number, radius: number } | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const startLocationWatch = useCallback(async () => {
        setLocationStatus('loading');
        try {
            // 1. Fetch Branch Settings first
            const res = await fetch('/api/settings/location', { cache: 'no-store' });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.latitude) {
                console.warn('No branch location set, skipping check');
                setLocationStatus('allowed');
                return;
            }

            const branch = data.data;
            setBranchLocation({ lat: branch.latitude, lng: branch.longitude, radius: branch.radius || 100 });

            // 2. Start Watch
            if (!navigator.geolocation) {
                setLocationStatus('error');
                return;
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    const dist = calculateDistance(userLat, userLng, branch.latitude, branch.longitude);
                    setDistance(Math.round(dist));

                    if (dist <= (branch.radius || 100)) {
                        setLocationStatus('allowed');
                    } else {
                        setLocationStatus('out-of-range');
                    }
                },
                (error) => {
                    console.error('Location error:', error);
                    if (error.code === error.PERMISSION_DENIED) {
                        setLocationStatus('denied');
                    } else {
                        setLocationStatus('error');
                    }
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );

        } catch (error) {
            console.error('Failed to init location check:', error);
            setLocationStatus('error');
        }
    }, []);

    useEffect(() => {
        startLocationWatch();
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [startLocationWatch]);


    const handleFaceMatch = useCallback(async (bestMatch: faceapi.FaceMatch) => {
        if (processingMatchRef.current || bestMatch.label === 'unknown') return;

        // --- LOCATION ENFORCEMENT ---
        if (locationStatus === 'out-of-range') {
            toast.error(`Cannot mark attendance: You are ${distance}m away.`, { id: 'location-error' });
            return;
        }
        if (locationStatus === 'denied' || locationStatus === 'error') {
            toast.error('Cannot mark attendance: Location verification failed.', { id: 'location-error' });
            return;
        }
        // -----------------------------

        processingMatchRef.current = true;

        try {
            const match = bestMatch.label.match(/\((.*?)\)$/);
            if (!match) return;
            const memberId = match[1];

            const res = await fetch('/api/attendance', {
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
                toast.success(data.message, { icon: data.type === 'IN' ? '👋' : '🚪' });
                setActivities(prev => [{
                    id: Date.now(),
                    text: data.message,
                    type: data.type, // Store type
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }, ...prev.slice(0, 9)]);

                // Refresh stats
                fetchStats();

                setTimeout(() => {
                    setIsScannerOpen(false);
                }, 1000);

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
            }, 2500);
        }
    }, [locationStatus, distance]); // Added dependencies

    const handleScanClick = () => {
        if (locationStatus === 'loading') {
            toast('Checking your location...', { icon: '📍' });
            return;
        }

        if (locationStatus === 'out-of-range') {
            toast.error(`You are ${distance ? distance + 'm' : ''} away from the branch location.`, { id: 'location-error' });
            return;
        }

        if (locationStatus === 'denied') {
            toast.error('Location access denied. Please enable location services.', { id: 'location-error' });
            return;
        }

        if (locationStatus === 'error') {
            toast.error('Unable to verify location.', { id: 'location-error' });
            return;
        }

        setIsScannerOpen(true);
    };

    const getButtonStyles = () => {
        if (locationStatus === 'out-of-range') return 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/20';
        if (locationStatus === 'denied' || locationStatus === 'error') return 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-gray-600/20';
        if (locationStatus === 'loading') return 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-yellow-600/20';
        return 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/20';
    };


    return (
        <div className="h-[calc(100vh-8rem)]">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

            <FaceScanModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onFaceMatch={handleFaceMatch}
                labeledDescriptors={labeledDescriptors}
                locationStatus={locationStatus}
                distance={distance}
                maxDistance={branchLocation?.radius}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Action Tag */}
                    <div className="relative">
                        <button
                            onClick={handleScanClick}
                            disabled={loading || !isModelsLoaded}
                            className={`w-full bg-gradient-to-r ${getButtonStyles()} text-white p-6 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between group disabled:opacity-75 disabled:cursor-not-allowed`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <ViewfinderCircleIcon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold">Face Recognition</h3>
                                    <p className="text-blue-100 text-sm">
                                        {locationStatus === 'out-of-range' ? `Out of Range (${distance}m)` :
                                            locationStatus === 'denied' ? 'Location Access Denied' :
                                                locationStatus === 'loading' ? 'Verifying Location...' : 'Tap to mark attendance'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
                                {loading ? 'Loading data...' : !isModelsLoaded ? 'Initializing AI...' :
                                    locationStatus === 'allowed' ? 'Ready to scan' : 'Location restricted'}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </button>
                        {locationStatus !== 'loading' && (
                            <button
                                onClick={() => startLocationWatch()}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                title="Refresh Location"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Dashboard Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-sm">Present Today</p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">{stats.present}</h4>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-sm">Late Arrivals</p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-2">{stats.late}</h4>
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
                            {activities.map((activity: any) => (
                                <div key={activity.id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-100/50 hover:bg-gray-100 transition-colors group">
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 shadow-sm transition-colors ${activity.type === 'IN' ? 'bg-green-50 border-green-200 text-green-600' :
                                        activity.type === 'OUT' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                            'bg-white border-gray-200 text-gray-500'
                                        }`}>
                                        {activity.type === 'IN' ? 'IN' : activity.type === 'OUT' ? 'OUT' : activity.text.charAt(0)}
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
