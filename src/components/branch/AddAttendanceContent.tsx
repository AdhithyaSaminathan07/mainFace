'use client';

import { useState, useEffect } from 'react';
import FaceEnrollModal from '@/components/FaceEnrollModal';
import * as faceapi from 'face-api.js';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function AddAttendanceContent() {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        role: '',
        employeeId: '',
    });
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

    // Preload models and fetch roles
    useEffect(() => {
        const loadData = async () => {
            const MODEL_URL = '/models';
            try {
                // Load models
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                console.log('Face models preloaded');

                // Set default role
                setAvailableRoles(['Staff']);
                setFormData(prev => ({ ...prev, role: 'Staff' }));
            } catch (err) {
                console.error('Failed to load data', err);
                setAvailableRoles(['Staff']);
            } finally {
                setIsLoadingRoles(false);
            }
        };
        loadData();
    }, []);

    const handleFaceDetected = (descriptor: Float32Array, image: string) => {
        setFaceDescriptor(Array.from(descriptor));
        setCapturedImage(image);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!faceDescriptor) {
            alert('Please enroll a face first.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    faceDescriptor,
                    images: capturedImage ? [capturedImage] : []
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to register member');
            }

            alert('Member registered successfully!');
            setFormData({ fullName: '', phone: '', role: availableRoles[0] || 'Staff', employeeId: '' });
            setFaceDescriptor(null);
            setCapturedImage(null);

        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Register New Member</h2>
                <p className="text-gray-500 mt-1">Add staff details and enroll their face for attendance tracking.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                                placeholder="e.g. John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Employee ID</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                                placeholder="e.g. EMP-001"
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Role / Designation</label>
                            <select
                                className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                disabled={isLoadingRoles}
                            >
                                {availableRoles.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Face Enrollment Section */}
                    <div className="pt-2 border-t border-gray-100">
                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3 block">Face Verification Data</label>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsEnrollModalOpen(true)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${faceDescriptor
                                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                </svg>
                                {faceDescriptor ? 'Update Face Data' : 'Add Face Data'}
                            </button>

                            {faceDescriptor ? (
                                <div className="flex items-center gap-2 text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Face Enrolled
                                </div>
                            ) : (
                                <span className="text-sm text-gray-500">
                                    (Required)
                                </span>
                            )}
                        </div>
                        {capturedImage && (
                            <div className="mt-3">
                                <img src={capturedImage} alt="Captured Face" className="h-16 w-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !faceDescriptor}
                            className={`px-8 py-3 font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 ${isSubmitting || !faceDescriptor
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                                : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30'
                                }`}
                        >
                            {isSubmitting ? 'Registering...' : 'Register Member'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal */}
            <FaceEnrollModal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
                onEnroll={handleFaceDetected}
            />
        </div>
    );
}
