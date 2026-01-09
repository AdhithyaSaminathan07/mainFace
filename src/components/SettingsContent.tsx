'use client';

import { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SettingsContent() {
    const [location, setLocation] = useState({
        latitude: '',
        longitude: '',
        radius: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/location');
                const data = await res.json();
                if (data.success && data.data) {
                    setLocation({
                        latitude: data.data.latitude?.toString() || '',
                        longitude: data.data.longitude?.toString() || '',
                        radius: data.data.radius?.toString() || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        const toastId = toast.loading('Fetching location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss(toastId);
                setLocation(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
                toast.success('Location fetched successfully');
            },
            (error) => {
                toast.dismiss(toastId);
                console.error('Error fetching location:', error);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        toast.error('Location permission denied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        toast.error('Location information unavailable');
                        break;
                    case error.TIMEOUT:
                        toast.error('Location request timed out');
                        break;
                    default:
                        toast.error('Failed to fetch location');
                }
            }
        );
    };

    const handleSave = async () => {
        const toastId = toast.loading('Saving settings...');
        try {
            const res = await fetch('/api/settings/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(location)
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Location settings updated successfully', { id: toastId });
            } else {
                toast.error(data.error || 'Failed to update settings', { id: toastId });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving settings', { id: toastId });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage branch location and geofencing</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                            <MapPinIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Location Settings</h2>
                    </div>
                    <button
                        onClick={handleGetCurrentLocation}
                        className="w-full sm:w-auto sm:ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center justify-center sm:justify-start gap-1 p-2 sm:p-0 bg-blue-50 sm:bg-transparent rounded-lg sm:rounded-none"
                    >
                        <MapPinIcon className="w-4 h-4" />
                        Use Current Location
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                            <input
                                type="text"
                                placeholder="e.g. 12.9716"
                                value={location.latitude}
                                onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                            <input
                                type="text"
                                placeholder="e.g. 77.5946"
                                value={location.longitude}
                                onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Geofence Radius (meters)</label>
                        <input
                            type="number"
                            placeholder="e.g. 100"
                            value={location.radius}
                            onChange={(e) => setLocation({ ...location, radius: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-2">Maximum distance allowed from the center point for valid attendance</p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Update Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
