/**
 * Calculates the straight-line distance between two points using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number|null} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Ensure all inputs are valid numbers
    const p1 = { lat: parseFloat(lat1), lon: parseFloat(lon1) };
    const p2 = { lat: parseFloat(lat2), lon: parseFloat(lon2) };

    if (isNaN(p1.lat) || isNaN(p1.lon) || isNaN(p2.lat) || isNaN(p2.lon)) {
        return null;
    }

    const R = 6371; // Earth's mean radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) * 
        Math.cos(p2.lat * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

/**
 * Formats distance for premium UI display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (km) => {
    if (km === null || km === undefined || isNaN(km)) return '';
    
    if (km < 1) {
        const meters = Math.round(km * 1000);
        return meters < 50 ? 'Nearby' : `approx ${meters}m`;
    }
    
    return `approx ${km.toFixed(1)} km`;
};
