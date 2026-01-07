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
}

export default function FaceScanModal({ isOpen, onClose, onFaceMatch, labeledDescriptors }: FaceScanModalProps) {
    const [lastMatch, setLastMatch] = useState<string | null>(null);

    const handleMatch = (match: faceapi.FaceMatch) => {
        // Prevent spamming the same match locally if needed, but the parent handles API cooldowns.
        // We can show visual feedback here.
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
                                        Attendance Scanner
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6">
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-gray-800 shadow-inner">
                                        <FaceCamera
                                            mode="scan"
                                            labeledDescriptors={labeledDescriptors}
                                            onFaceMatch={handleMatch}
                                            showAdvancedVisuals={true}
                                        />
                                    </div>
                                    <p className="text-center text-gray-400 mt-4 text-sm">
                                        Look at the camera to mark your attendance.
                                    </p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
