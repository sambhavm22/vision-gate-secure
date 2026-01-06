import { AddressProvider, AddressSearchResult, ReverseGeocodeResult } from './AddressProvider';

/**
 * Mock address dataset - hardcoded Indian addresses for development
 * No external API calls required
 */
const MOCK_ADDRESSES: AddressSearchResult[] = [
    // Mumbai
    { id: 'addr_1', label: 'Andheri West, Mumbai', latitude: 19.1364, longitude: 72.8296, city: 'Mumbai', pincode: '400058' },
    { id: 'addr_2', label: 'Bandra Kurla Complex, Mumbai', latitude: 19.0596, longitude: 72.8656, city: 'Mumbai', pincode: '400051' },
    { id: 'addr_3', label: 'Powai, Mumbai', latitude: 19.1176, longitude: 72.9060, city: 'Mumbai', pincode: '400076' },
    { id: 'addr_4', label: 'Colaba, Mumbai', latitude: 18.9067, longitude: 72.8147, city: 'Mumbai', pincode: '400005' },

    // Delhi
    { id: 'addr_5', label: 'Connaught Place, New Delhi', latitude: 28.6315, longitude: 77.2167, city: 'New Delhi', pincode: '110001' },
    { id: 'addr_6', label: 'Saket, New Delhi', latitude: 28.5244, longitude: 77.2066, city: 'New Delhi', pincode: '110017' },
    { id: 'addr_7', label: 'Dwarka Sector 21, New Delhi', latitude: 28.5526, longitude: 77.0581, city: 'New Delhi', pincode: '110077' },

    // Bengaluru
    { id: 'addr_8', label: 'Koramangala, Bengaluru', latitude: 12.9352, longitude: 77.6245, city: 'Bengaluru', pincode: '560034' },
    { id: 'addr_9', label: 'Indiranagar, Bengaluru', latitude: 12.9719, longitude: 77.6412, city: 'Bengaluru', pincode: '560038' },
    { id: 'addr_10', label: 'Whitefield, Bengaluru', latitude: 12.9698, longitude: 77.7500, city: 'Bengaluru', pincode: '560066' },
    { id: 'addr_11', label: 'Electronic City, Bengaluru', latitude: 12.8456, longitude: 77.6603, city: 'Bengaluru', pincode: '560100' },

    // Hyderabad
    { id: 'addr_12', label: 'Hitech City, Hyderabad', latitude: 17.4435, longitude: 78.3772, city: 'Hyderabad', pincode: '500081' },
    { id: 'addr_13', label: 'Banjara Hills, Hyderabad', latitude: 17.4156, longitude: 78.4347, city: 'Hyderabad', pincode: '500034' },

    // Chennai
    { id: 'addr_14', label: 'T Nagar, Chennai', latitude: 13.0418, longitude: 80.2341, city: 'Chennai', pincode: '600017' },
    { id: 'addr_15', label: 'OMR, Chennai', latitude: 12.9516, longitude: 80.2408, city: 'Chennai', pincode: '600119' },

    // Pune
    { id: 'addr_16', label: 'Koregaon Park, Pune', latitude: 18.5362, longitude: 73.8940, city: 'Pune', pincode: '411001' },
    { id: 'addr_17', label: 'Hinjewadi, Pune', latitude: 18.5912, longitude: 73.7380, city: 'Pune', pincode: '411057' },

    // Kolkata
    { id: 'addr_18', label: 'Salt Lake City, Kolkata', latitude: 22.5800, longitude: 88.4200, city: 'Kolkata', pincode: '700091' },

    // Ahmedabad
    { id: 'addr_19', label: 'Satellite, Ahmedabad', latitude: 23.0225, longitude: 72.5167, city: 'Ahmedabad', pincode: '380015' },

    // Jaipur
    { id: 'addr_20', label: 'Malviya Nagar, Jaipur', latitude: 26.8505, longitude: 75.8016, city: 'Jaipur', pincode: '302017' },
];

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function getDistanceFromLatLng(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Mock Address Provider Implementation
 * Uses hardcoded dataset for address search and reverse geocoding
 * No external API calls - perfect for local development
 */
export class MockAddressProvider implements AddressProvider {
    /**
     * Search addresses by label (case-insensitive)
     * Returns up to 5 matching results
     */
    async search(query: string): Promise<AddressSearchResult[]> {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const normalizedQuery = query.toLowerCase().trim();

        const results = MOCK_ADDRESSES.filter(addr =>
            addr.label.toLowerCase().includes(normalizedQuery) ||
            addr.city.toLowerCase().includes(normalizedQuery) ||
            addr.pincode.includes(normalizedQuery)
        );

        // Return top 5 matches
        return results.slice(0, 5);
    }

    /**
     * Reverse geocode coordinates to address
     * Uses OpenStreetMap Nominatim API for accurate address details
     */
    async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
        try {
            // Use OpenStreetMap Nominatim for free reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'VisionGateSecure/1.0' // Nominatim requires User-Agent
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.address) {
                // Extract components from OSM response
                const address = data.address;

                // Build full address from components
                const addressParts = [
                    address.house_number,
                    address.road,
                    address.neighbourhood || address.suburb,
                    address.village || address.town
                ].filter(Boolean);

                const fullAddress = addressParts.length > 0
                    ? addressParts.join(', ')
                    : data.display_name.split(',').slice(0, 2).join(',');

                const city = address.city
                    || address.town
                    || address.village
                    || address.state_district
                    || address.state
                    || 'Unknown City';

                const pincode = address.postcode || '';

                return {
                    fullAddress,
                    city,
                    pincode
                };
            }

            // Fallback if no address data
            return {
                fullAddress: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                city: 'Unknown',
                pincode: ''
            };

        } catch (error) {
            console.error('Reverse geocoding error:', error);

            // Fallback to coordinate display on error
            return {
                fullAddress: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                city: 'Unknown',
                pincode: ''
            };
        }
    }
}

// Export a singleton instance for convenience
export const mockAddressProvider = new MockAddressProvider();
