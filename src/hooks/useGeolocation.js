import { useState, useCallback } from 'react';

/**
 * Custom hook to handle browser geolocation
 * @returns {Object} Geolocation state and control functions
 */
export const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setLoading(false);
            },
            (err) => {
                let errorMessage = 'Failed to get location';
                if (err.code === 1) {
                    errorMessage = 'Location permission denied. Please enable it in your browser settings.';
                } else if (err.code === 2) {
                    errorMessage = 'Location information is unavailable.';
                } else if (err.code === 3) {
                    errorMessage = 'Location request timed out.';
                }
                setError(errorMessage);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, []);

    return { location, error, loading, getLocation };
};
