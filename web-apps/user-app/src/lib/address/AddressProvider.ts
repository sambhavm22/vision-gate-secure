/**
 * Address Provider Interface
 * Provider-agnostic abstraction for address search and geocoding.
 * Implement this interface to swap between providers (Mock, Google, Mapbox, etc.)
 */

export interface AddressSearchResult {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    city: string;
    pincode: string;
}

export interface ReverseGeocodeResult {
    fullAddress: string;
    city: string;
    pincode: string;
}

export interface AddressProvider {
    /**
     * Search for addresses matching the query string
     * @param query - Search text to match against address labels
     * @returns Promise resolving to array of matching addresses
     */
    search(query: string): Promise<AddressSearchResult[]>;

    /**
     * Get a human-readable address from coordinates
     * @param lat - Latitude
     * @param lng - Longitude  
     * @returns Promise resolving to address details
     */
    reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult>;
}
