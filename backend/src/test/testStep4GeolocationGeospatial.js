const baseUrl = 'http://localhost:5000/api';

const runStep4GeolocationGeospatialTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 4: GEOLOCATION & GEOSPATIAL 2DSPHERE AUDIT');
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
    // SECTION 1: GEOJSON SCHEMA STRUCTURE & COORDINATE ORDER
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Event GeoJSON Structure & [lng, lat] Ordering ---');
    const allEventsRes = await fetch(`${baseUrl}/events?limit=50`);
    assert(allEventsRes.status === 200, 'GET /api/events returns 200 OK');
    const allEventsData = await allEventsRes.json();
    assert(Array.isArray(allEventsData.data) && allEventsData.data.length >= 10, `Retrieved ${allEventsData.data.length} events from database`);

    for (const ev of allEventsData.data) {
      assert(ev.location && typeof ev.location === 'object', `Event "${ev.title}" has location object`);
      assert(ev.location.type === 'Point', `Event "${ev.title}" location.type is exactly "Point"`);
      assert(Array.isArray(ev.location.coordinates) && ev.location.coordinates.length === 2, `Event "${ev.title}" coordinates is [lng, lat] 2-element array`);
      
      const [lng, lat] = ev.location.coordinates;
      assert(typeof lng === 'number' && lng >= -180 && lng <= 180, `Event "${ev.title}" longitude (${lng}) is within valid range [-180, 180]`);
      assert(typeof lat === 'number' && lat >= -90 && lat <= 90, `Event "${ev.title}" latitude (${lat}) is within valid range [-90, 90]`);
      assert(typeof ev.location.address === 'string' && ev.location.address.trim().length > 0, `Event "${ev.title}" has valid address string`);
    }

    // -----------------------------------------------------------------
    // SECTION 2: MUMBAI NEARBY SEARCH & DISTANCE ACCURACY
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Mumbai Nearby Search (lat: 19.0760, lng: 72.8777) ---');
    const mumbaiLat = 19.0760;
    const mumbaiLng = 72.8777;

    const mumbai50KmRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50`);
    assert(mumbai50KmRes.status === 200, 'GET /events/nearby for Mumbai (50km) returns 200 OK');
    const mumbai50KmData = await mumbai50KmRes.json();
    assert(mumbai50KmData.data.length > 0, `Found ${mumbai50KmData.data.length} events within 50 km of Mumbai`);
    
    // Check all events returned are in/around Mumbai (all distanceKm <= 50)
    for (const ev of mumbai50KmData.data) {
      assert(ev.distanceKm <= 50, `Mumbai event "${ev.title}" distance (${ev.distanceKm} km) <= 50 km`);
      assert(['mumbai', 'navi mumbai', 'thane'].includes(ev.location.city.toLowerCase()), `Event "${ev.title}" is in Mumbai region (found: ${ev.location.city})`);
    }

    // -----------------------------------------------------------------
    // SECTION 3: RADIUS SCALE TESTING (1km, 5km, 10km, 25km, 50km)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Radius Values (1 km, 5 km, 10 km, 25 km, 50 km) ---');
    
    // Bandra center point
    const bandraLat = 19.0596;
    const bandraLng = 72.8358;

    const r1Res = await fetch(`${baseUrl}/events/nearby?lat=${bandraLat}&lng=${bandraLng}&radius=1`);
    const r1Data = await r1Res.json();
    assert(r1Res.status === 200, 'GET /events/nearby?radius=1 returns 200 OK');
    assert(r1Data.data.every(e => e.distanceKm <= 1.0), 'All events in 1 km radius have distance <= 1 km');

    const r5Res = await fetch(`${baseUrl}/events/nearby?lat=${bandraLat}&lng=${bandraLng}&radius=5`);
    const r5Data = await r5Res.json();
    assert(r5Res.status === 200, 'GET /events/nearby?radius=5 returns 200 OK');
    assert(r5Data.data.every(e => e.distanceKm <= 5.0), 'All events in 5 km radius have distance <= 5 km');
    assert(r5Data.data.length >= r1Data.data.length, '5 km search returns >= events than 1 km search');

    const r10Res = await fetch(`${baseUrl}/events/nearby?lat=${bandraLat}&lng=${bandraLng}&radius=10`);
    const r10Data = await r10Res.json();
    assert(r10Res.status === 200, 'GET /events/nearby?radius=10 returns 200 OK');
    assert(r10Data.data.every(e => e.distanceKm <= 10.0), 'All events in 10 km radius have distance <= 10 km');
    assert(r10Data.data.length >= r5Data.data.length, '10 km search returns >= events than 5 km search');

    const r25Res = await fetch(`${baseUrl}/events/nearby?lat=${bandraLat}&lng=${bandraLng}&radius=25`);
    const r25Data = await r25Res.json();
    assert(r25Res.status === 200, 'GET /events/nearby?radius=25 returns 200 OK');
    assert(r25Data.data.every(e => e.distanceKm <= 25.0), 'All events in 25 km radius have distance <= 25 km');
    assert(r25Data.data.length >= r10Data.data.length, '25 km search returns >= events than 10 km search');

    const r50Res = await fetch(`${baseUrl}/events/nearby?lat=${bandraLat}&lng=${bandraLng}&radius=50`);
    const r50Data = await r50Res.json();
    assert(r50Res.status === 200, 'GET /events/nearby?radius=50 returns 200 OK');
    assert(r50Data.data.every(e => e.distanceKm <= 50.0), 'All events in 50 km radius have distance <= 50 km');
    assert(r50Data.data.length >= r25Data.data.length, '50 km search returns >= events than 25 km search');

    // -----------------------------------------------------------------
    // SECTION 4: MULTI-CITY GEOGRAPHIC ISOLATION (Pune, Bengaluru, Delhi & Outside-India Zero-Match)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Multi-City Isolation (Pune, Bengaluru, Delhi & Outside-India Bounds) ---');

    // 4.1 Pune (lat: 18.5204, lng: 73.8567)
    const puneLat = 18.5204;
    const puneLng = 73.8567;
    const puneRes = await fetch(`${baseUrl}/events/nearby?lat=${puneLat}&lng=${puneLng}&radius=25`);
    const puneData = await puneRes.json();
    assert(puneRes.status === 200, 'GET /events/nearby for Pune returns 200 OK');
    assert(puneData.data.length > 0, `Found ${puneData.data.length} events in Pune`);
    assert(puneData.data.every(e => e.location.city.toLowerCase() === 'pune'), 'All events returned for Pune origin belong to Pune');
    assert(puneData.data.every(e => !e.location.city.toLowerCase().includes('mumbai') && !e.location.city.toLowerCase().includes('bengaluru')), 'Pune search strictly excludes Mumbai and Bengaluru events');

    // 4.2 Bengaluru (lat: 12.9716, lng: 77.5946)
    const blrLat = 12.9716;
    const blrLng = 77.5946;
    const blrRes = await fetch(`${baseUrl}/events/nearby?lat=${blrLat}&lng=${blrLng}&radius=25`);
    const blrData = await blrRes.json();
    assert(blrRes.status === 200, 'GET /events/nearby for Bengaluru returns 200 OK');
    assert(blrData.data.length > 0, `Found ${blrData.data.length} events in Bengaluru`);
    assert(blrData.data.every(e => e.location.city.toLowerCase().includes('bengaluru')), 'All events returned for Bengaluru origin belong to Bengaluru');
    assert(blrData.data.every(e => !e.location.city.toLowerCase().includes('mumbai') && !e.location.city.toLowerCase().includes('pune')), 'Bengaluru search strictly excludes Mumbai and Pune events');

    // 4.3 Outside-India Coordinates (e.g. London 51.5074, -0.1278) -> Must return 0 events
    const londonLat = 51.5074;
    const londonLng = -0.1278;
    const londonRes = await fetch(`${baseUrl}/events/nearby?lat=${londonLat}&lng=${londonLng}&radius=25`);
    const londonData = await londonRes.json();
    assert(londonRes.status === 200, 'GET /events/nearby for London returns 200 OK');
    assert(londonData.data.length === 0, 'Non-Indian coordinates (London) return 0 events');

    // -----------------------------------------------------------------
    // SECTION 5: HAVERSINE DISTANCE ACCURACY & SORTING
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Haversine Distance Accuracy & Spatial Ordering ---');
    // Events returned from nearby search should have distanceKm populated
    assert(puneData.data.every(e => typeof e.distanceKm === 'number' && e.distanceKm >= 0), 'Every returned event has non-negative numeric distanceKm');
    
    // Check sorting: results returned should be ordered by proximity
    for (let i = 0; i < puneData.data.length - 1; i++) {
      assert(puneData.data[i].distanceKm <= puneData.data[i + 1].distanceKm, 
        `Distance ordering: ${puneData.data[i].title} (${puneData.data[i].distanceKm} km) <= ${puneData.data[i+1].title} (${puneData.data[i+1].distanceKm} km)`);
    }

    // -----------------------------------------------------------------
    // SECTION 6: PARAMETER VALIDATION & ERROR GUARDRAILS
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Geospatial Parameter Validation & Error Handling ---');

    // 6.1 Missing latitude
    const missingLatRes = await fetch(`${baseUrl}/events/nearby?lng=72.8777&radius=10`);
    assert(missingLatRes.status === 400, 'Missing "lat" returns 400 Bad Request');

    // 6.2 Missing longitude
    const missingLngRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&radius=10`);
    assert(missingLngRes.status === 400, 'Missing "lng" returns 400 Bad Request');

    // 6.3 Latitude > 90
    const outOfBoundsLat = await fetch(`${baseUrl}/events/nearby?lat=95.5&lng=72.8777&radius=10`);
    assert(outOfBoundsLat.status === 400, 'Latitude > 90 returns 400 Bad Request');

    // 6.4 Latitude < -90
    const negOutOfBoundsLat = await fetch(`${baseUrl}/events/nearby?lat=-91.2&lng=72.8777&radius=10`);
    assert(negOutOfBoundsLat.status === 400, 'Latitude < -90 returns 400 Bad Request');

    // 6.5 Longitude > 180
    const outOfBoundsLng = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=185.0&radius=10`);
    assert(outOfBoundsLng.status === 400, 'Longitude > 180 returns 400 Bad Request');

    // 6.6 Longitude < -180
    const negOutOfBoundsLng = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=-181.0&radius=10`);
    assert(negOutOfBoundsLng.status === 400, 'Longitude < -180 returns 400 Bad Request');

    // 6.7 Invalid non-numeric strings
    const strCoords = await fetch(`${baseUrl}/events/nearby?lat=invalid&lng=72.8777&radius=10`);
    assert(strCoords.status === 400, 'Non-numeric lat string returns 400 Bad Request');

    // 6.8 Radius <= 0
    const zeroRadius = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=0`);
    assert(zeroRadius.status === 400, 'Radius = 0 returns 400 Bad Request');

    // 6.9 Radius > 100
    const excessiveRadius = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=250`);
    assert(excessiveRadius.status === 400, 'Radius > 100km returns 400 Bad Request');

    // -----------------------------------------------------------------
    // SECTION 7: EVENT CREATION GEOJSON VALIDATION
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Event Creation GeoJSON Validation Guardrails ---');
    
    // Attempt to create event with invalid coordinates via validator
    const { validateEventInput } = require('../validators/eventValidator');
    
    const invalidCoordsTest = validateEventInput({
      title: 'Bad Coordinates Event',
      description: 'Test description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      price: 0,
      location: {
        address: 'Sample Address',
        coordinates: [200, 45] // Invalid longitude > 180
      }
    });
    assert(!invalidCoordsTest.isValid, 'Event validator rejects longitude > 180');

    const invalidLatTest = validateEventInput({
      title: 'Bad Latitude Event',
      description: 'Test description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      price: 0,
      location: {
        address: 'Sample Address',
        coordinates: [72.8, 95] // Invalid latitude > 90
      }
    });
    assert(!invalidLatTest.isValid, 'Event validator rejects latitude > 90');

    const missingCoordsTest = validateEventInput({
      title: 'Missing Coordinates Event',
      description: 'Test description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      price: 0,
      location: {
        address: 'Sample Address',
        coordinates: [72.8] // Only 1 element
      }
    });
    assert(!missingCoordsTest.isValid, 'Event validator rejects single-element coordinates array');

    console.log('\n====================================================');
    console.log(`STEP 4 GEOLOCATION & GEOSPATIAL AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Step 4 Audit Failed:', err);
    process.exit(1);
  }
};

runStep4GeolocationGeospatialTests();
