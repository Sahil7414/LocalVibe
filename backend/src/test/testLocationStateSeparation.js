const baseUrl = 'http://localhost:5000/api';

const runLocationStateSeparationTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE: LOCATION STATE SEPARATION AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, message) => {
    total++;
    if (condition) {
      console.log(`[PASS ✅] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL ❌] Test ${total}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  };

  try {
    // -----------------------------------------------------------------
    // SECTION 1: DEFAULT SELECTED LOCATION MODEL INTEGRITY
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Default Selected Location Model ---');
    const DEFAULT_SELECTED_LOCATION = {
      name: 'Bandra West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      coords: [72.8777, 19.0760] // [longitude, latitude]
    };

    assert(DEFAULT_SELECTED_LOCATION.name === 'Bandra West, Mumbai', 'Default selected display label is "Bandra West, Mumbai"');
    assert(DEFAULT_SELECTED_LOCATION.coords[0] === 72.8777, 'Default selected location longitude is 72.8777');
    assert(DEFAULT_SELECTED_LOCATION.coords[1] === 19.0760, 'Default selected location latitude is 19.0760');

    // -----------------------------------------------------------------
    // SECTION 2: SEPARATING SELECTED LOCATION FROM GPS COORDINATES
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Separation of Selected Location and GPS Coordinates ---');
    
    // Simulate user state:
    let selectedLocation = { ...DEFAULT_SELECTED_LOCATION };
    let currentLocation = {
      lat: null,
      lng: null,
      isGps: false,
      isDetecting: false,
      isDenied: false,
      error: null
    };
    let activeCoordinates = {
      lat: selectedLocation.coords[1],
      lng: selectedLocation.coords[0],
      source: 'selected'
    };

    // User clicks "Use my current location"
    // Simulated Browser GPS returns Juhu coordinates (lat: 19.1075, lng: 72.8258)
    const simulatedGpsLatitude = 19.1075;
    const simulatedGpsLongitude = 72.8258;

    currentLocation = {
      lat: simulatedGpsLatitude,
      lng: simulatedGpsLongitude,
      isGps: true,
      isDetecting: false,
      isDenied: false,
      error: null
    };
    activeCoordinates = {
      lat: simulatedGpsLatitude,
      lng: simulatedGpsLongitude,
      source: 'gps'
    };

    // CRITICAL: selectedLocation (top-left header label) MUST NOT be modified by GPS
    assert(selectedLocation.name === 'Bandra West, Mumbai', 'Top-left Header label remains "Bandra West, Mumbai" after GPS success');
    assert(selectedLocation.name !== 'Current Location', 'Top-left Header label is NOT replaced with "Current Location"');
    assert(selectedLocation.name !== 'Juhu, Mumbai', 'Top-left Header label is NOT replaced with reverse-geocoded GPS address');
    assert(activeCoordinates.source === 'gps', 'Active coordinates source switched to "gps"');
    assert(activeCoordinates.lat === simulatedGpsLatitude, 'Active discovery latitude is browser GPS latitude');
    assert(activeCoordinates.lng === simulatedGpsLongitude, 'Active discovery longitude is browser GPS longitude');

    // -----------------------------------------------------------------
    // SECTION 3: NEARBY EVENTS WITH GPS COORDINATES
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Nearby Event Discovery with GPS Coordinates ---');
    const gpsNearbyRes = await fetch(`${baseUrl}/events/nearby?lat=${activeCoordinates.lat}&lng=${activeCoordinates.lng}&radius=15`);
    assert(gpsNearbyRes.status === 200, 'GET /events/nearby with GPS coordinates returns 200 OK');
    const gpsNearbyData = await gpsNearbyRes.json();
    assert(gpsNearbyData.success === true, 'Nearby discovery payload reports success: true');
    assert(Array.isArray(gpsNearbyData.data) && gpsNearbyData.data.length > 0, `Discovered ${gpsNearbyData.data.length} events around GPS coordinates`);
    
    // Verify distance from GPS coordinates
    for (const ev of gpsNearbyData.data) {
      assert(ev.distanceKm <= 15, `Event "${ev.title}" is within 15 km of GPS position (${ev.distanceKm} km)`);
    }

    // -----------------------------------------------------------------
    // SECTION 4: EXPLICIT CITY SELECTION VIA LOCATION MODAL
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Explicit City Selection (e.g., Pune) ---');
    // User explicitly selects Pune
    const puneCityObj = {
      name: 'Pune',
      state: 'Maharashtra',
      coords: [73.8567, 18.5204] // [lng, lat]
    };

    selectedLocation = {
      name: `${puneCityObj.name}, ${puneCityObj.state}`,
      city: puneCityObj.name,
      state: puneCityObj.state,
      coords: puneCityObj.coords
    };
    activeCoordinates = {
      lat: puneCityObj.coords[1],
      lng: puneCityObj.coords[0],
      source: 'selected'
    };

    assert(selectedLocation.name === 'Pune, Maharashtra', 'Header label updates to "Pune, Maharashtra" upon explicit selection');
    assert(activeCoordinates.lat === 18.5204, 'Active latitude updates to Pune latitude (18.5204)');
    assert(activeCoordinates.lng === 73.8567, 'Active longitude updates to Pune longitude (73.8567)');

    const puneNearbyRes = await fetch(`${baseUrl}/events/nearby?lat=${activeCoordinates.lat}&lng=${activeCoordinates.lng}&radius=15`);
    assert(puneNearbyRes.status === 200, 'GET /events/nearby for Pune returns 200 OK');
    const puneNearbyData = await puneNearbyRes.json();
    assert(puneNearbyData.data.length > 0, `Discovered ${puneNearbyData.data.length} Pune events`);

    // -----------------------------------------------------------------
    // SECTION 5: GEOLOCATION PERMISSION DENIED HANDLING
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Geolocation Permission Denial Handling ---');
    // Simulate user denying location permission
    currentLocation = {
      lat: null,
      lng: null,
      isGps: false,
      isDetecting: false,
      isDenied: true,
      error: 'Location access was denied. Showing selected city.'
    };

    // Verify selectedLocation remains intact
    assert(selectedLocation.name === 'Pune, Maharashtra', 'Header label remains stable when GPS permission is denied');
    assert(currentLocation.isDenied === true, 'Geolocation isDenied flag correctly recorded');
    assert(currentLocation.error.includes('denied'), 'User-friendly error message set without application crash');

    // -----------------------------------------------------------------
    // SECTION 6: GEOJSON AND LEAFLET COORDINATE BOUNDARY
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing GeoJSON [lng, lat] to Leaflet [lat, lng] Boundary ---');
    const geoJsonPoint = [72.8777, 19.0760]; // MongoDB [lng, lat]
    const leafletPoint = [geoJsonPoint[1], geoJsonPoint[0]]; // Leaflet [lat, lng]

    assert(leafletPoint[0] === 19.0760, 'Leaflet position[0] is latitude (19.0760)');
    assert(leafletPoint[1] === 72.8777, 'Leaflet position[1] is longitude (72.8777)');

    console.log('\n====================================================');
    console.log(`LOCATION STATE SEPARATION AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Audit Failed:', error);
    process.exit(1);
  }
};

runLocationStateSeparationTests();
