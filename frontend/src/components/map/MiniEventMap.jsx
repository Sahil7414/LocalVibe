import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryColor } from './MapPin';

// Create custom SVG Leaflet divIcon for Event Details Mini Map Pin
const createMiniMapIcon = (category, isFeatured) => {
  const color = isFeatured ? '#FFA000' : getCategoryColor(category);
  const size = 38;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size * 1.25}px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: ${isFeatured
        ? 'drop-shadow(0 0 10px rgba(255, 160, 0, 0.8))'
        : 'drop-shadow(0 3px 6px rgba(30, 34, 56, 0.35))'};
    ">
      ${isFeatured ? `
        <div style="
          position: absolute;
          width: ${size * 1.5}px;
          height: ${size * 1.5}px;
          border-radius: 50%;
          background: rgba(255, 160, 0, 0.3);
          animation: pulseGlow 2s infinite;
          z-index: -1;
        "></div>
      ` : ''}
      <svg viewBox="0 0 32 40" width="${size}" height="${size * 1.25}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 26.5 14.2 38.8 14.8 39.3C15.5 39.9 16.5 39.9 17.2 39.3C17.8 38.8 32 26.5 32 16C32 7.163 24.837 0 16 0Z" fill="${color}" />
        <circle cx="16" cy="15" r="7" fill="#FFFFFF" />
        <circle cx="16" cy="15" r="4.5" fill="${color}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-mini-map-pin',
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25],
    popupAnchor: [0, -size * 1.25]
  });
};

export const MiniEventMap = ({
  coordinates, // GeoJSON [longitude, latitude]
  title = 'Event Venue',
  address = '',
  category = 'General',
  isFeatured = false,
  height = '200px',
  className = '',
  style = {}
}) => {
  if (!coordinates || coordinates.length < 2) return null;

  // CRITICAL: Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
  const leafletPosition = [coordinates[1], coordinates[0]];
  const icon = useMemo(() => createMiniMapIcon(category, isFeatured), [category, isFeatured]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`;

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
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}
      >
        <MapContainer
          center={leafletPosition}
          zoom={15}
          scrollWheelZoom={false}
          dragging={!L.Browser.mobile}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={leafletPosition} icon={icon}>
            <Popup>
              <div style={{ padding: '4px', fontSize: 'var(--font-size-xs)' }}>
                <strong>{title}</strong>
                <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>{address}</div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {address}
        </span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
            marginLeft: '8px'
          }}
        >
          Get Directions ↗
        </a>
      </div>
    </div>
  );
};
