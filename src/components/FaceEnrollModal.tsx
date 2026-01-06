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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 text-left align-middle shadow-2xl transition-all border border-gray-700">
                                {/* Header */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-white flex items-center gap-2">
                                        <FaceSmileIcon className="w-6 h-6 text-blue-400" />
                                        Face Enrollment
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6">
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-gray-800 shadow-inner">
                                        {isCaptured && (
                                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                                                <CheckCircleIcon className="w-20 h-20 text-green-400 mb-4 animate-bounce" />
                                                <p className="text-2xl font-bold text-white">Face Scanned!</p>
                                                <p className="text-gray-300">Processing...</p>
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
                                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-green-400 font-mono border border-green-900/50">
                                                FPS: {qualityMetrics.fps}
                                            </div>
                                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-blue-400 font-mono border border-blue-900/50">
                                                RES: {qualityMetrics.resolution}
                                            </div>
                                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-purple-400 font-mono border border-purple-900/50">
                                                ANG: {qualityMetrics.angle}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Bar */}
                                    <div className="mt-6 space-y-2">
                                        <div className="flex justify-between items-end text-sm">
                                            <span className="text-gray-400 font-medium">Scan Quality / Accuracy</span>
                                            <span className={`font-mono font-bold ${qualityScore > 80 ? 'text-green-400' : qualityScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {qualityScore}%
                                            </span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
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
