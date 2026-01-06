'use client';

import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceCameraProps {
    onFaceDetected?: (descriptor: Float32Array, image: string) => void;
    onFaceMatch?: (bestMatch: faceapi.FaceMatch) => void;
    labeledDescriptors?: faceapi.LabeledFaceDescriptors[];
    mode: 'enroll' | 'scan';
}

export default function FaceCamera({ onFaceDetected, onFaceMatch, labeledDescriptors, mode }: FaceCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [message, setMessage] = useState('Loading models...');
    const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);

    // Stability tracking
    const stabilityCounter = useRef(0);
    const lastDescriptor = useRef<Float32Array | null>(null);
    const STABILITY_THRESHOLD = 15; // Approx 1-2 seconds at 100ms intervals

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        if (labeledDescriptors && labeledDescriptors.length > 0) {
            setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
        }
    }, [labeledDescriptors]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setIsModelLoaded(true);
            setMessage('Starting camera...');
            startVideo();
        } catch (err) {
            console.error('Error loading models:', err);
            setMessage('Error loading face recognition models.');
        }
    };

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                console.error('Error opening video:', err);
                setMessage('Camera permission denied.');
            });
    };

    const handleVideoPlay = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const displaySize = {
            width: videoRef.current.offsetWidth,
            height: videoRef.current.offsetHeight
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detectFace = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            // Detect single face
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detection) {
                const resizedDetections = faceapi.resizeResults(detection, displaySize);

                // --- Quality Checks ---
                const { box } = resizedDetections.detection;
                const { width, height } = displaySize;
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;

                // 1. Center Check
                const isCentered = Math.abs(centerX - width / 2) < width * 0.15 && Math.abs(centerY - height / 2) < height * 0.15;
                // 2. Distance Check (Size) - Box width should be at least 20% of screen width, but not too big (e.g., > 80%)
                const isGoodDistance = box.width > width * 0.25 && box.width < width * 0.7;
                // 3. Lighting (Simple brightness check on center) - Not fully implemented here without heavy pixel read, assume camera auto-exposure does okay, or add logic later.

                if (!isGoodDistance) {
                    setMessage(box.width < width * 0.2 ? 'Move closer' : 'Move back');
                    stabilityCounter.current = 0;
                } else if (!isCentered) {
                    setMessage('Center your face');
                    stabilityCounter.current = 0;
                } else {
                    // Passed Checks
                    setMessage('Hold still...');
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                    // --- Processing ---
                    if (mode === 'enroll') {
                        // For enrollment, just check stability of detection
                        stabilityCounter.current++;
                        if (stabilityCounter.current > STABILITY_THRESHOLD) {
                            // Snap!
                            setMessage('Face Captured!');
                            stabilityCounter.current = 0; // Reset

                            // Capture Image
                            const imgCanvas = document.createElement('canvas');
                            imgCanvas.width = videoRef.current.videoWidth;
                            imgCanvas.height = videoRef.current.videoHeight;
                            imgCanvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                            const image = imgCanvas.toDataURL('image/jpeg');

                            if (onFaceDetected) {
                                onFaceDetected(detection.descriptor, image);
                            }
                        }
                    } else if (mode === 'scan') {
                        // For scan, match against descriptors
                        if (faceMatcher) {
                            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                            // Visual feedback
                            const label = bestMatch.toString();
                            const drawBox = new faceapi.draw.DrawBox(box, { label });
                            drawBox.draw(canvas);

                            if (bestMatch.label !== 'unknown') {
                                stabilityCounter.current++;
                                if (stabilityCounter.current > 5) { // Faster for matching
                                    setMessage(`Welcome, ${bestMatch.label.split('(')[0]}`); // Hacky label parse
                                    if (onFaceMatch) {
                                        onFaceMatch(bestMatch);
                                        // Brief pause to avoid spam
                                        stabilityCounter.current = -20;
                                    }
                                }
                            } else {
                                stabilityCounter.current = 0;
                                setMessage('Face not recognized');
                            }
                        }
                    }
                }

            } else {
                setMessage('Looking for face...');
                stabilityCounter.current = 0;
            }

            // Loop
            setTimeout(detectFace, 100);
        };

        detectFace();
    };


    return (
        <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            {!isModelLoaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900 text-white">
                    <p className="animate-pulse">{message}</p>
                </div>
            )}

            <div className="relative w-full h-full">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    onPlay={handleVideoPlay}
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" // Mirror canvas too
                />
            </div>

            {/* Overlay Message */}
            <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center">
                <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full text-white font-medium shadow-lg">
                    {message}
                </div>
            </div>

            {/* Guide Frame (Optional visual cue) */}
            <div className="absolute inset-0 pointer-events-none border-[3px] border-white/20 rounded-xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-dashed border-white/50 rounded-full opacity-50"></div>
            </div>
        </div>
    );
}
