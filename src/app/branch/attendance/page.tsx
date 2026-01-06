'use client';

import { useState } from 'react';
import FaceCamera from '@/components/FaceCamera';
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

    const handleFaceDetected = (descriptor: Float32Array, image: string) => {
        if (!faceDescriptor) {
            setFaceDescriptor(Array.from(descriptor));
            setCapturedImage(image);
            // toast.success('Face Captured Successfully!');
        }
    };

    const handleRetake = () => {
        setFaceDescriptor(null);
        setCapturedImage(null);
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Face Enrollment
                            </h3>
                            {faceDescriptor && (
                                <button
                                    onClick={handleRetake}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Retake Photo
                                </button>
                            )}
                        </div>

                        {/* Camera Viewfinder */}
                        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-inner">
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                            ) : (
                                <FaceCamera mode="enroll" onFaceDetected={handleFaceDetected} />
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
        </div>
    );
}

