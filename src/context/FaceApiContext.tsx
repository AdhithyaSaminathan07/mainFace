'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceApiContextType {
    isModelsLoaded: boolean;
    error: string | null;
}

const FaceApiContext = createContext<FaceApiContextType>({
    isModelsLoaded: false,
    error: null,
});

export const useFaceApi = () => useContext(FaceApiContext);

interface FaceApiProviderProps {
    children: React.ReactNode;
}

export const FaceApiProvider: React.FC<FaceApiProviderProps> = ({ children }) => {
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                if (faceapi.nets.ssdMobilenetv1.isLoaded &&
                    faceapi.nets.tinyFaceDetector.isLoaded &&
                    faceapi.nets.faceLandmark68Net.isLoaded &&
                    faceapi.nets.faceRecognitionNet.isLoaded) {
                    setIsModelsLoaded(true);
                    return;
                }

                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setIsModelsLoaded(true);
                console.log('FaceAPI models loaded globally');
            } catch (err: any) {
                console.error('Failed to load FaceAPI models:', err);
                setError(err.message || 'Failed to load face recognition models');
            }
        };

        loadModels();
    }, []);

    return (
        <FaceApiContext.Provider value={{ isModelsLoaded, error }}>
            {children}
        </FaceApiContext.Provider>
    );
};
