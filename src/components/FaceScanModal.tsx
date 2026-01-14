'use client';

import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import FaceCamera from './FaceCamera';
import * as faceapi from 'face-api.js';

interface FaceScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFaceMatch: (match: faceapi.FaceMatch) => void;
    labeledDescriptors: faceapi.LabeledFaceDescriptors[];
    locationStatus?: 'loading' | 'allowed' | 'denied' | 'out-of-range' | 'error';
    distance?: number | null;
    maxDistance?: number;
}

export default function FaceScanModal({ isOpen, onClose, onFaceMatch, labeledDescriptors, locationStatus, distance, maxDistance }: FaceScanModalProps) {
    const [lastMatch, setLastMatch] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset success state when modal opens
    if (!isOpen && isSuccess) {
        setIsSuccess(false);
    }

    const handleMatch = (match: faceapi.FaceMatch) => {
        setIsSuccess(true);
        setLastMatch(match.label);
        onFaceMatch(match);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100 flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 flex items-center gap-2">
                                        <div className="p-1.5 bg-green-100 rounded-lg">
                                            <FaceSmileIcon className="w-5 h-5 text-green-600" />
                                        </div>
                                        Attendance Scanner
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-all">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-0 sm:p-6 flex-1 overflow-hidden flex flex-col relative">
                                    {/* Success Overlay */}
                                    {isSuccess && (
                                        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 text-green-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Authenticated!</h3>
                                            <p className="text-gray-500">Marking attendance for {lastMatch?.split('(')[0]}...</p>
                                        </div>
                                    )}

                                    {/* Location Warning Banner */}
                                    {locationStatus === 'out-of-range' && (
                                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-center text-red-700 animate-pulse">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Out of Range: You are {distance}m away. Move within {maxDistance}m to mark attendance.</span>
                                        </div>
                                    )}

                                    <div className="relative w-full h-[60vh] sm:h-[600px] bg-gray-900 overflow-hidden sm:rounded-2xl cursor-crosshair sm:border sm:border-gray-200 sm:shadow-inner sm:ring-4 sm:ring-gray-50 flex flex-col items-center justify-center group">
                                        {/* Scanning Animation (Pure CSS) */}
                                        {(!isSuccess && locationStatus === 'allowed' || !locationStatus) && (
                                            <div className="absolute inset-0 pointer-events-none z-10 opacity-50">
                                                <div className="w-full h-1 bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                            </div>
                                        )}

                                        {locationStatus === 'allowed' || !locationStatus ? (
                                            <FaceCamera
                                                mode="scan"
                                                labeledDescriptors={labeledDescriptors}
                                                onFaceMatch={handleMatch}
                                                showAdvancedVisuals={true}
                                            />
                                        ) : (
                                            <div className="text-center p-6 text-white/80">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                                </svg>
                                                <h3 className="text-xl font-bold">Scanner Disabled</h3>
                                                <p className="mt-2 text-sm max-w-md mx-auto">
                                                    {locationStatus === 'out-of-range' ? 'You are not at the branch location.' : 'Location verification failed.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center p-4 bg-white shrink-0">
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {isSuccess ? 'Verified' : (locationStatus === 'allowed' || !locationStatus ? 'Position your face within the frame' : 'Scanner unavailable')}
                                        </h4>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isSuccess ? 'Please wait...' : (locationStatus === 'allowed' || !locationStatus ? 'The system will automatically mark your attendance when recognized.' : 'Please return to the branch location to scan.')}
                                        </p>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
