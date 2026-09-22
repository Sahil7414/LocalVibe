import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodingService } from '../../services/geocodingService';

// Custom Pin Icon for Location Picker
const createLocationPickerIcon = () => {
  const color = '#FF5A36'; // Sunset Coral
  const size = 42;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size * 1.3}px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 6px 14px rgba(255, 90, 54, 0.45));
      cursor: grab;
    ">
      <div style="
        position: absolute;
        width: 14px;
        height: 6px;
        border-radius: 50%;
        background: rgba(30, 34, 56, 0.25);
        bottom: -2px;
        filter: blur(2px);
      "></div>
      <svg viewBox="0 0 32 42" width="${size}" height="${size * 1.3}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 27.5 14.5 40.5 15.2 41.2C15.6 41.6 16.4 41.6 16.8 41.2C17.5 40.5 32 27.5 32 16C32 7.163 24.837 0 16 0Z" fill="${color}" />
        <circle cx="16" cy="16" r="7" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="4.5" fill="${color}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-location-picker-pin',
    iconSize: [size, size * 1.3],
    iconAnchor: [size / 2, size * 1.3],
    popupAnchor: [0, -size * 1.3]
  });
};

// Map click listener hook component
const MapClickHandler = ({ onLocationPick }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const reverse = await geocodingService.reverseGeocode(lat, lng);
      onLocationPick({
        lat,
        lng,
        address: reverse.address,
        city: reverse.city
      });
    }
  });
  return null;
};

// Map view recenter controller component
const RecenterController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

export const LocationPickerMap = ({
  coordinates = [72.8295, 19.0596], // GeoJSON [longitude, latitude]
  address = '',
  onLocationChange,
  height = '280px',
  className = '',
  style = {}
}) => {
  // CRITICAL: Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
  const leafletPosition = useMemo(() => {
    if (!coordinates || coordinates.length < 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      return [19.0596, 72.8295]; // Default to Bandra West, Mumbai
    }
    return [coordinates[1], coordinates[0]];
  }, [coordinates]);

  const markerIcon = useMemo(() => createLocationPickerIcon(), []);

  const handleMarkerDragEnd = async (event) => {
    const marker = event.target;
    const position = marker.getLatLng();
    const reverse = await geocodingService.reverseGeocode(position.lat, position.lng);
    if (onLocationChange) {
      onLocationChange({
        lat: position.lat,
        lng: position.lng,
        address: reverse.address,
        city: reverse.city
      });
    }
  };

  const handleMapClick = (locationData) => {
    if (onLocationChange) {
      onLocationChange(locationData);
    }
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        ...style
      }}
    >
      <div
        style={{
          width: '100%',
          height,
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          zIndex: 0,
          isolation: 'isolate'
        }}
      >
        <MapContainer
          center={leafletPosition}
          zoom={15}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationPick={handleMapClick} />
          <RecenterController center={leafletPosition} />

          {/* 500m Walkable Radar Geofence Circle Overlay */}
          <Circle
            center={leafletPosition}
            radius={500}
            pathOptions={{
              color: '#FF5A36',
              fillColor: '#FF5A36',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4, 6'
            }}
          />

          <Marker
            position={leafletPosition}
            icon={markerIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd
            }}
          >
            <Popup>
              <div style={{ padding: '4px', fontSize: 'var(--font-size-xs)' }}>
                <strong style={{ color: 'var(--color-primary)' }}>Pinned Venue</strong>
                <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {address || `${leafletPosition[0].toFixed(4)}, ${leafletPosition[1].toFixed(4)}`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  💡 Drag pin or click map to reposition
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Walkable Radar Tag */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(30, 34, 56, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#FF5A36',
              display: 'inline-block'
            }}
          />
          500m Walkable Radar
        </div>

        {/* Floating Coordinate Readout */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            color: 'var(--color-text-primary)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>GPS:</span> {leafletPosition[0].toFixed(5)}, {leafletPosition[1].toFixed(5)}
          {(leafletPosition[0] < 6.0 || leafletPosition[0] > 38.0 || leafletPosition[1] < 68.0 || leafletPosition[1] > 98.0) && (
            <span style={{ color: '#DC2626', fontWeight: 600 }}>⚠️ Outside India</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        <span>Click on the map or drag the pin to set the exact venue coordinates (India only)</span>
        <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>
          GeoJSON: [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}]
        </span>
      </div>
    </div>
  );
};
