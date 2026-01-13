'use client';

import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useFaceApi } from '@/context/FaceApiContext';

interface FaceCameraProps {
    onFaceDetected?: (descriptor: Float32Array, image: string) => void;
    onFaceMatch?: (bestMatch: faceapi.FaceMatch) => void;
    labeledDescriptors?: faceapi.LabeledFaceDescriptors[];
    mode: 'enroll' | 'scan';
    showAdvancedVisuals?: boolean;
    onQualityChange?: (score: number, metrics: { fps: number, resolution: string, angle: string }) => void;
}

export default function FaceCamera({ onFaceDetected, onFaceMatch, labeledDescriptors, mode, showAdvancedVisuals, onQualityChange }: FaceCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isModelsLoaded, error } = useFaceApi();
    const [message, setMessage] = useState('Initializing camera...');
    const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);

    // Stability tracking
    const stabilityCounter = useRef(0);
    const lastDescriptor = useRef<Float32Array | null>(null);
    const STABILITY_THRESHOLD = 15; // Approx 1-2 seconds at 100ms intervals

    useEffect(() => {
        if (isModelsLoaded) {
            startVideo();
            setMessage('Starting camera...');
        } else if (error) {
            setMessage(error);
        } else {
            setMessage('Loading models...');
        }
    }, [isModelsLoaded, error]);

    useEffect(() => {
        if (labeledDescriptors && labeledDescriptors.length > 0) {
            setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
        } else {
            setFaceMatcher(null);
        }
    }, [labeledDescriptors]);

    const startVideo = async () => {
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error opening video with ideal constraints:', err);
            // Fallback to basic video constraint
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (fallbackErr) {
                console.error('Error opening video with fallback:', fallbackErr);
                setMessage('Camera access denied or unavailable.');
            }
        }
    };

    const handleVideoPlay = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const displaySize = {
            width: videoRef.current.offsetWidth,
            height: videoRef.current.offsetHeight
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        // Use a constant options object to prevent GC pressure
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });

        const detectFace = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const startTime = performance.now();

            // Detect single face using TinyFaceDetector for speed
            const detection = await faceapi.detectSingleFace(videoRef.current, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!canvasRef.current || !videoRef.current) return; // Component might have unmounted

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detection) {
                const resizedDetections = faceapi.resizeResults(detection, displaySize);

                // --- Quality Checks ---
                const { box } = resizedDetections.detection;
                const { landmarks } = resizedDetections;
                const { width, height } = displaySize;
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;

                // 1. Center Check
                const isCentered = Math.abs(centerX - width / 2) < width * 0.15 && Math.abs(centerY - height / 2) < height * 0.15;

                // 2. Distance Check (Size)
                const isGoodDistance = box.width > width * 0.25 && box.width < width * 0.7;

                // 3. Head Pose (Look Straight) Check
                // Nose tip: 30, Left Eye Outer: 36, Right Eye Outer: 45
                const nose = landmarks.getNose()[3]; // Tip of nose (index 3 is point 30 in 68-point model?) - actually getNose() returns array of points.
                // face-api landmarks.getNose() returns 9 points (27-35). Tip is index 3 (point 30).
                const leftEye = landmarks.getLeftEye()[0]; // Outer corner
                const rightEye = landmarks.getRightEye()[3]; // Outer corner
                const jaw = landmarks.getJawOutline();
                const mouth = landmarks.getMouth();

                // Simple symmetry check: Distance from nose to left eye vs right eye
                const distToLeft = Math.abs(nose.x - leftEye.x);
                const distToRight = Math.abs(rightEye.x - nose.x);
                const ratio = distToLeft / (distToRight || 1); // Avoid div by zero

                const isLookingStraight = ratio > 0.5 && ratio < 2.0;

                // Calculate Quality Score (0-100)
                let score = detection.detection.score * 100;
                if (!isCentered) score -= 20;
                if (!isGoodDistance) score -= 20;
                if (!isLookingStraight) score -= 30;
                score = Math.max(0, Math.min(100, score));

                if (onQualityChange) {
                    const fps = 1000 / (performance.now() - startTime + 0.1); // approx
                    onQualityChange(Math.round(score), {
                        fps: Math.round(fps),
                        resolution: `${Math.round(box.width)}x${Math.round(box.height)}`,
                        angle: isLookingStraight ? 'Frontal' : 'Tilted'
                    });
                }

                // --- Advanced Visuals ---
                if (showAdvancedVisuals && ctx) {
                    // Draw 3D Box / Axes
                    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
                    // Approximate pitch/yaw from facial landmarks relationships
                    // (This is a simplified estimation for visual effect)

                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(roll);

                    // Draw target reticle
                    ctx.strokeStyle = score > 80 ? '#00ff00' : '#00aaff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, box.width * 0.3, 0, Math.PI * 2);
                    ctx.stroke();

                    // Draw "Scanning" lines if good quality
                    if (score > 60) {
                        ctx.beginPath();
                        ctx.moveTo(-box.width * 0.4, 0);
                        ctx.lineTo(box.width * 0.4, 0);
                        ctx.moveTo(0, -box.height * 0.4);
                        ctx.lineTo(0, box.height * 0.4);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.stroke();
                    }

                    ctx.restore();
                }

                if (!isGoodDistance) {
                    setMessage(box.width < width * 0.25 ? 'Move closer' : 'Move back');
                    stabilityCounter.current = 0;
                } else if (!isCentered) {
                    setMessage('Center your face');
                    stabilityCounter.current = 0;
                } else if (!isLookingStraight) {
                    setMessage('Look straight ahead');
                    stabilityCounter.current = 0;
                } else {
                    // Passed Checks
                    setMessage('Hold still...');
                    if (!showAdvancedVisuals) {
                        faceapi.draw.drawDetections(canvas, resizedDetections);
                    }
                    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                    // --- Processing ---
                    if (mode === 'enroll') {
                        // For enrollment, just check stability of detection
                        stabilityCounter.current++;
                        if (stabilityCounter.current > STABILITY_THRESHOLD) {
                            // Snap!
                            setMessage('Face Captured!');
                            stabilityCounter.current = 0; // Reset

                            // Capture Image (Compressed)
                            const imgCanvas = document.createElement('canvas');
                            const MAX_WIDTH = 600;
                            const scale = Math.min(1, MAX_WIDTH / videoRef.current.videoWidth);
                            imgCanvas.width = videoRef.current.videoWidth * scale;
                            imgCanvas.height = videoRef.current.videoHeight * scale;

                            const ctx = imgCanvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(videoRef.current, 0, 0, imgCanvas.width, imgCanvas.height);
                                // Compress to 0.8 quality JPEG
                                const image = imgCanvas.toDataURL('image/jpeg', 0.8);

                                if (onFaceDetected) {
                                    onFaceDetected(detection.descriptor, image);
                                }
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
                                if (stabilityCounter.current > 2) { // Faster for matching
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
            setTimeout(detectFace, 30);
        };

        detectFace();
    };


    return (
        <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden shadow-sm">
            {!isModelsLoaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 text-gray-500">
                    <p className="animate-pulse font-medium">{message}</p>
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
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full text-gray-900 font-semibold shadow-lg border border-white/50">
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
