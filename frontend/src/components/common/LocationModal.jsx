import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

const POPULAR_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', coords: [72.8777, 19.0760] },
  { name: 'Delhi NCR', state: 'Delhi', coords: [77.1025, 28.7041] },
  { name: 'Bengaluru', state: 'Karnataka', coords: [77.5946, 12.9716] },
  { name: 'Pune', state: 'Maharashtra', coords: [73.8567, 18.5204] },
  { name: 'Hyderabad', state: 'Telangana', coords: [78.4867, 17.3850] },
  { name: 'Chennai', state: 'Tamil Nadu', coords: [80.2707, 13.0827] },
  { name: 'Kolkata', state: 'West Bengal', coords: [88.3639, 22.5726] },
  { name: 'Ahmedabad', state: 'Gujarat', coords: [72.5714, 23.0225] },
  { name: 'Jaipur', state: 'Rajasthan', coords: [75.7873, 26.9124] },
  { name: 'Goa', state: 'Goa', coords: [73.8278, 15.4989] },
  { name: 'Kochi', state: 'Kerala', coords: [76.2673, 9.9312] },
  { name: 'Chandigarh', state: 'Punjab / Haryana', coords: [76.7794, 30.7333] },
  { name: 'Lucknow', state: 'Uttar Pradesh', coords: [80.9462, 26.8467] },
  { name: 'Indore', state: 'Madhya Pradesh', coords: [75.8577, 22.7196] },
  { name: 'Surat', state: 'Gujarat', coords: [72.8311, 21.1702] },
  { name: 'Bhopal', state: 'Madhya Pradesh', coords: [77.4126, 23.2599] },
  { name: 'Vadodara', state: 'Gujarat', coords: [73.1812, 22.3072] },
  { name: 'Coimbatore', state: 'Tamil Nadu', coords: [76.9558, 11.0168] },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', coords: [83.2185, 17.6868] },
  { name: 'Varanasi', state: 'Uttar Pradesh', coords: [82.9739, 25.3176] },
  { name: 'Amritsar', state: 'Punjab', coords: [74.8723, 31.6340] },
  { name: 'Dehradun', state: 'Uttarakhand', coords: [78.0322, 30.3165] },
  { name: 'Guwahati', state: 'Assam', coords: [91.7362, 26.1445] },
  { name: 'Bhubaneswar', state: 'Odisha', coords: [85.8245, 20.2961] },
  { name: 'Mysore', state: 'Karnataka', coords: [76.6394, 12.2958] },
  { name: 'Pondicherry', state: 'Puducherry', coords: [79.8083, 11.9416] }
];

export const LocationModal = ({
  isOpen,
  onClose,
  currentCity = 'Mumbai',
  onSelectLocation,
  onDetectLocation,
  isDetecting = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = POPULAR_CITIES.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (cityObj) => {
    if (onSelectLocation) {
      onSelectLocation(cityObj);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Your Location"
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* GPS Auto-Detect Button */}
        <Button
          variant={currentCity === 'Current Location' ? 'primary' : 'outline'}
          size="md"
          fullWidth
          iconLeft={isDetecting ? '⏳' : '🎯'}
          isLoading={isDetecting}
          onClick={onDetectLocation}
          style={{
            justifyContent: 'center',
            borderColor: 'var(--color-primary)',
            color: currentCity === 'Current Location' ? '#FFFFFF' : 'var(--color-primary)'
          }}
        >
          {isDetecting
            ? 'Detecting your GPS position...'
            : (currentCity === 'Current Location' ? '✓ Using Current GPS Location' : 'Use my current location')}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            OR SEARCH CITY
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
        </div>

        {/* Search Input */}
        <Input
          placeholder="Search city, neighborhood or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          iconLeft="🔍"
          autoFocus
        />

        {/* Popular / Filtered Cities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            {searchQuery ? 'Matching Cities' : 'Popular Cities'}
          </span>

          {filteredCities.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              No cities match "{searchQuery}"
            </div>
          ) : (
            filteredCities.map((city) => {
              const isSelected = city.name.toLowerCase() === currentCity.toLowerCase();
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className="focus-ring"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>📍</span>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {city.name}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {city.state}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                      ✓ Selected
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
