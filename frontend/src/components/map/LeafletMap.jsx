import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPopupCard } from './MapPopupCard';
import { getCategoryColor } from './MapPin';

// Component to handle dynamic map panning / centering
const MapController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), {
        animate: true,
        duration: 0.8
      });
    }
  }, [center, zoom, map]);

  return null;
};

// Create custom SVG Leaflet divIcon for events
const createEventIcon = (category, isFeatured, isSelected) => {
  const color = isFeatured ? '#FFA000' : getCategoryColor(category);
  const size = isSelected ? 44 : isFeatured ? 40 : 34;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size * 1.25}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
      filter: ${isFeatured
        ? 'drop-shadow(0 0 10px rgba(255, 160, 0, 0.8))'
        : isSelected
        ? 'drop-shadow(0 6px 12px rgba(255, 90, 54, 0.5))'
        : 'drop-shadow(0 2px 5px rgba(30, 34, 56, 0.3))'};
      transition: all 0.2s ease-in-out;
    ">
      ${isFeatured ? `
        <div style="
          position: absolute;
          width: ${size * 1.6}px;
          height: ${size * 1.6}px;
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
    className: 'custom-event-pin',
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25],
    popupAnchor: [0, -size * 1.25]
  });
};

// Create custom SVG Leaflet divIcon for User Location
const createUserLocationIcon = () => {
  const html = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.35);
        animation: pulseGlow 2s infinite;
      "></div>
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3B82F6;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        z-index: 1;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-location-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export const LeafletMap = ({
  center = [19.0760, 72.8777], // Leaflet order: [lat, lng]
  zoom = 13,
  events = [],
  selectedEventId,
  onSelectEvent,
  userLocation,
  radiusKm = 15,
  onRecenter,
  className = '',
  style = {}
}) => {
  const userIcon = useMemo(() => createUserLocationIcon(), []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '350px',
        overflow: 'hidden',
        ...style
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        <MapController center={center} zoom={zoom} />

        {/* Standard OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Radius Search Boundary Geofence Circle Overlay (radius in meters) */}
        {center && center[0] && center[1] && radiusKm && (
          <Circle
            center={[center[0], center[1]]}
            radius={radiusKm * 1000} // Convert km to meters
            pathOptions={{
              color: '#0F766E', // Primary Teal
              fillColor: '#0F766E',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '6, 8'
            }}
          />
        )}

        {/* User Current GPS Location Marker */}
        {userLocation && userLocation.lat && userLocation.lng && userLocation.isGps && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>
              <div style={{ padding: '4px', fontSize: '12px', fontWeight: 600 }}>
                📍 Your GPS Position
              </div>
            </Popup>
          </Marker>
        )}

        {/* Event Markers */}
        {events.map((event) => {
          const eventId = event._id || event.id;
          const coords = event.location?.coordinates;
          if (!coords || coords.length < 2) return null;

          // CRITICAL: Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const leafletPosition = [coords[1], coords[0]];
          const isSelected = selectedEventId === eventId;
          const icon = createEventIcon(event.category, event.isFeatured, isSelected);

          return (
            <Marker
              key={eventId}
              position={leafletPosition}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectEvent) {
                    onSelectEvent(event);
                  }
                }
              }}
            >
              <Popup>
                <MapPopupCard event={event} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Recenter FAB */}
      {onRecenter && (
        <button
          type="button"
          onClick={onRecenter}
          className="focus-ring hover-lift"
          aria-label="Re-center to my location"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 400,
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          🎯
        </button>
      )}
    </div>
  );
};
