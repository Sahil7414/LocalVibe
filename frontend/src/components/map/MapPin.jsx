import React from 'react';

/**
 * Helper to get category color token or fallback
 */
export const getCategoryColor = (category) => {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'music':
      return '#805AD5'; // Purple
    case 'food & drink':
    case 'food':
      return '#DD6B20'; // Orange
    case 'nightlife':
      return '#E53E3E'; // Red
    case 'arts & culture':
    case 'arts':
      return '#D69E2E'; // Yellow / Ochre
    case 'sports & fitness':
    case 'sports':
      return '#38A169'; // Green
    case 'community':
      return '#3182CE'; // Blue
    case 'markets':
      return '#319795'; // Teal
    default:
      return '#FF5A5F'; // Coral primary
  }
};

/**
 * Standard Event Map Pin (Teardrop SVG with Category Color)
 */
export const EventPinSVG = ({
  category = 'General',
  isFeatured = false,
  isSelected = false,
  size = 36
}) => {
  const pinColor = isFeatured ? '#FFB400' : getCategoryColor(category);

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size * 1.25}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isSelected ? 'scale(1.25)' : 'scale(1)',
        transition: 'transform var(--transition-fast)',
        filter: isFeatured
          ? 'drop-shadow(0 0 8px rgba(255, 180, 0, 0.7))'
          : isSelected
          ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
      }}
    >
      {isFeatured && (
        <div
          style={{
            position: 'absolute',
            width: `${size * 1.5}px`,
            height: `${size * 1.5}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 180, 0, 0.3)',
            animation: 'pulseGlow 2s infinite ease-in-out',
            zIndex: -1
          }}
        />
      )}

      <svg
        viewBox="0 0 32 40"
        width={size}
        height={size * 1.25}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 0C7.163 0 0 7.163 0 16C0 26.5 14.2 38.8 14.8 39.3C15.5 39.9 16.5 39.9 17.2 39.3C17.8 38.8 32 26.5 32 16C32 7.163 24.837 0 16 0Z"
          fill={pinColor}
        />
        <circle cx="16" cy="15" r="7" fill="#FFFFFF" />
        <circle cx="16" cy="15" r="4.5" fill={pinColor} />
      </svg>
    </div>
  );
};

/**
 * User Location Marker (Blue pulsing dot)
 */
export const UserLocationPin = ({ size = 20 }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: `${size * 2}px`,
        height: `${size * 2}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: `${size * 2}px`,
          height: `${size * 2}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(49, 130, 206, 0.35)',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }}
      />
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: '#3182CE',
          border: '3px solid #FFFFFF',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 1
        }}
      />
    </div>
  );
};
