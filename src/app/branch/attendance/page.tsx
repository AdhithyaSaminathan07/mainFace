'use client';

import { useState } from 'react';
import FaceEnrollModal from '@/components/FaceEnrollModal';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is installed based on history

export default function AddMemberPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        role: 'Staff',
        employeeId: '',
    });
    // We store the first high-quality descriptor we see
    const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

    const handleFaceDetected = (descriptor: Float32Array, image: string) => {
        setFaceDescriptor(Array.from(descriptor));
        setCapturedImage(image);
        // toast.success('Face Captured Successfully!');
    };

    const handleRetake = () => {
        setFaceDescriptor(null);
        setCapturedImage(null);
        setIsEnrollModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!faceDescriptor) {
            alert('Please enroll a face first.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/branch/members', {
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
            // Reset form
            setFormData({ fullName: '', phone: '', role: 'Staff', employeeId: '' });
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
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Register New Member</h2>
                <p className="text-gray-500 mt-1">Add staff details and enroll their face for attendance tracking.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Member Details Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            Member Details
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Security">Security</option>
                                </select>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Face Enrollment */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Face Enrollment
                            </h3>
                            {faceDescriptor && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Enrolled
                                </span>
                            )}
                        </div>

                        {/* Viewfinder / Placeholder */}
                        <div className="flex-1 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center">
                            {capturedImage ? (
                                <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden shadow-lg group">
                                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={handleRetake}
                                            className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100"
                                        >
                                            Retake Photo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-medium">No Face Enrolled</p>
                                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                                            Click the button below to open the scanner and enroll the employee's face.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsEnrollModalOpen(true)}
                                        className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                            </svg>
                                            Add Face
                                        </span>
                                        {/* Pulse Effect */}
                                        <span className="absolute inset-0 rounded-lg animate-ping bg-blue-400 opacity-20"></span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !faceDescriptor}
                            className={`px-8 py-3 font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 ${isSubmitting || !faceDescriptor
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : 'bg-green-600 text-white shadow-green-600/20 hover:bg-green-700 hover:shadow-green-600/30'
                                }`}
                        >
                            {isSubmitting ? 'Registering...' : 'Register Member'}
                        </button>
                    </div>
                </div>
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

