import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon not showing in React-Leaflet
// See: https://github.com/PaulLeCam/react-leaflet/issues/453
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapPosition {
    lat: number;
    lng: number;
}

interface MapPickerProps {
    /** Current marker position */
    position?: MapPosition;
    /** Called when marker position changes (drag or click) */
    onPositionChange?: (position: MapPosition) => void;
    /** Height of the map container */
    height?: string | number;
    /** Whether to disable interactions */
    disabled?: boolean;
}

// Default center: India
const DEFAULT_CENTER: MapPosition = {
    lat: 20.5937,
    lng: 78.9629
};
const DEFAULT_ZOOM = 5;
const LOCATION_ZOOM = 14;

/**
 * Component to handle map click events
 */
function MapClickHandler({ onPositionChange }: { onPositionChange?: (pos: MapPosition) => void }) {
    useMapEvents({
        click(e) {
            if (onPositionChange) {
                onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        }
    });
    return null;
}

/**
 * Component to center map when position changes
 */
function MapCenterUpdater({ position }: { position?: MapPosition }) {
    const map = useMap();

    useEffect(() => {
        if (position && position.lat !== 0 && position.lng !== 0) {
            map.setView([position.lat, position.lng], LOCATION_ZOOM);
        }
    }, [position, map]);

    return null;
}

/**
 * Draggable marker component
 */
function DraggableMarker({
    position,
    onPositionChange
}: {
    position: MapPosition;
    onPositionChange?: (pos: MapPosition) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker && onPositionChange) {
                const latlng = marker.getLatLng();
                onPositionChange({ lat: latlng.lat, lng: latlng.lng });
            }
        }
    }), [onPositionChange]);

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
        />
    );
}

/**
 * MapPicker Component
 * 
 * Interactive map for selecting locations using Leaflet + OpenStreetMap.
 * Supports:
 * - Draggable marker
 * - Click to move marker
 * - Controlled position via props
 */
export function MapPicker({
    position,
    onPositionChange,
    height = '300px',
    disabled = false
}: MapPickerProps) {
    const currentPosition = position || DEFAULT_CENTER;
    const hasPosition = position && position.lat !== 0 && position.lng !== 0;

    return (
        <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
            <MapContainer
                center={hasPosition ? [position.lat, position.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
                zoom={hasPosition ? LOCATION_ZOOM : DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={!disabled}
                dragging={!disabled}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!disabled && <MapClickHandler onPositionChange={onPositionChange} />}
                <MapCenterUpdater position={position} />

                {hasPosition && (
                    <DraggableMarker
                        position={currentPosition}
                        onPositionChange={disabled ? undefined : onPositionChange}
                    />
                )}
            </MapContainer>
        </div>
    );
}

export default MapPicker;
