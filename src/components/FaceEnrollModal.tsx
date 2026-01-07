'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import FaceCamera from './FaceCamera';
import * as faceapi from 'face-api.js';

interface FaceEnrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnroll: (descriptor: Float32Array, image: string) => void;
}

export default function FaceEnrollModal({ isOpen, onClose, onEnroll }: FaceEnrollModalProps) {
    const [qualityScore, setQualityScore] = useState(0);
    const [qualityMetrics, setQualityMetrics] = useState({ fps: 0, resolution: '0x0', angle: 'N/A' });
    const [isCaptured, setIsCaptured] = useState(false);

    const handleFaceDetected = (descriptor: Float32Array, image: string) => {
        setIsCaptured(true);
        // Play success sound or animation delay
        setTimeout(() => {
            onEnroll(descriptor, image);
            onClose();
        }, 1500);
    };

    const handleQualityChange = (score: number, metrics: any) => {
        setQualityScore(score);
        setQualityMetrics(metrics);
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
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                            <FaceSmileIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        Face Enrollment
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full p-1 transition-all">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-0 sm:p-6 flex-1 overflow-hidden flex flex-col">
                                    <div className="relative w-full h-[60vh] sm:h-[600px] bg-gray-900 overflow-hidden sm:rounded-xl border border-gray-200 shadow-inner ring-4 ring-gray-50">
                                        {isCaptured && (
                                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                                                <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
                                                <p className="text-2xl font-bold text-gray-900">Face Scanned!</p>
                                                <p className="text-gray-500">Processing...</p>
                                            </div>
                                        )}

                                        <FaceCamera
                                            mode="enroll"
                                            onFaceDetected={handleFaceDetected}
                                            showAdvancedVisuals={true}
                                            onQualityChange={handleQualityChange}
                                        />

                                        {/* HUD Overlay */}
                                        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
                                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-green-400 font-mono border border-green-900/50 shadow-sm">
                                                FPS: {qualityMetrics.fps}
                                            </div>
                                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-blue-400 font-mono border border-blue-900/50 shadow-sm">
                                                RES: {qualityMetrics.resolution}
                                            </div>
                                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-purple-400 font-mono border border-purple-900/50 shadow-sm">
                                                ANG: {qualityMetrics.angle}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Bar */}
                                    <div className="mt-4 sm:mt-6 space-y-2 p-4 sm:p-0 shrink-0 bg-white">
                                        <div className="flex justify-between items-end text-sm">
                                            <span className="text-gray-600 font-medium">Scan Quality / Accuracy</span>
                                            <span className={`font-mono font-bold ${qualityScore > 80 ? 'text-green-600' : qualityScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {qualityScore}%
                                            </span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                            <div
                                                className={`h-full transition-all duration-300 ease-out ${qualityScore > 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                                    qualityScore > 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                                                        'bg-gradient-to-r from-red-500 to-pink-500'
                                                    }`}
                                                style={{ width: `${qualityScore}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Keep your head steady and look straight at the camera. Green box indicates optimal position.
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
