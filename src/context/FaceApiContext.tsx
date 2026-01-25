'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
// import * as faceapi from 'face-api.js'; // Removed for dynamic import

interface FaceApiContextType {
    isModelsLoaded: boolean;
    error: string | null;
    faceApi: any;
}

const FaceApiContext = createContext<FaceApiContextType>({
    isModelsLoaded: false,
    error: null,
    faceApi: null,
});

export const useFaceApi = () => useContext(FaceApiContext);

interface FaceApiProviderProps {
    children: React.ReactNode;
}

export const FaceApiProvider: React.FC<FaceApiProviderProps> = ({ children }) => {
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [faceApiInstance, setFaceApiInstance] = useState<any>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                // Dynamic import
                const faceapiModule = await import('face-api.js');
                // Check if 'default' exists, otherwise use module namespace
                const faceapi = (faceapiModule as any).default || faceapiModule;
                setFaceApiInstance(faceapi);

                if (faceapi.nets.tinyFaceDetector.isLoaded &&
                    faceapi.nets.faceLandmark68Net.isLoaded &&
                    faceapi.nets.faceRecognitionNet.isLoaded) {
                    setIsModelsLoaded(true);
                    return;
                }

                await Promise.all([
                    // faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Heavy, not used by FaceCamera (uses TinyFace)
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setIsModelsLoaded(true);
                console.log('FaceAPI models loaded (Lazy)');
            } catch (err: any) {
                console.error('Failed to load FaceAPI models:', err);
                setError(err.message || 'Failed to load face recognition models');
            }
        };

        loadModels();
    }, []);

    return (
        <FaceApiContext.Provider value={{ isModelsLoaded, error, faceApi: faceApiInstance }}>
            {children}
        </FaceApiContext.Provider>
    );
};
