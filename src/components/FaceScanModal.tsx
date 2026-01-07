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
                                <div className="p-0 sm:p-6 flex-1 overflow-hidden flex flex-col">
                                    <div className="relative w-full h-[60vh] sm:h-[600px] bg-gray-900 overflow-hidden sm:rounded-2xl cursor-crosshair sm:border sm:border-gray-200 sm:shadow-inner sm:ring-4 sm:ring-gray-50">
                                        <FaceCamera
                                            mode="scan"
                                            labeledDescriptors={labeledDescriptors}
                                            onFaceMatch={handleMatch}
                                            showAdvancedVisuals={true}
                                        />
                                    </div>
                                    <div className="text-center p-4 bg-white shrink-0">
                                        <h4 className="text-lg font-medium text-gray-900">Position your face within the frame</h4>
                                        <p className="text-gray-500 text-sm mt-1">
                                            The system will automatically mark your attendance when recognized.
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
