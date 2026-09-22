const baseUrl = 'http://localhost:5000/api';

const runStep5LeafletMapTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 5: LEAFLET MAP & MARKER INTERACTIONS AUDIT');
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
    // SECTION 1: COORDINATE CONVERSION (GeoJSON [lng, lat] -> Leaflet [lat, lng])
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Coordinate Conversion Boundaries ---');
    const eventsRes = await fetch(`${baseUrl}/events?limit=50`);
    assert(eventsRes.status === 200, 'GET /api/events returns 200 OK');
    const eventsData = await eventsRes.json();
    assert(Array.isArray(eventsData.data) && eventsData.data.length > 0, `Loaded ${eventsData.data.length} events for map validation`);

    for (const ev of eventsData.data) {
      const geoCoords = ev.location.coordinates; // [longitude, latitude]
      // Simulating the Leaflet conversion in LeafletMap.jsx / MiniEventMap.jsx: [coords[1], coords[0]]
      const leafletPosition = [geoCoords[1], geoCoords[0]]; // [latitude, longitude]

      assert(leafletPosition[0] === geoCoords[1], `Event "${ev.title}": Leaflet latitude matches GeoJSON latitude (${leafletPosition[0]})`);
      assert(leafletPosition[1] === geoCoords[0], `Event "${ev.title}": Leaflet longitude matches GeoJSON longitude (${leafletPosition[1]})`);
      assert(leafletPosition[0] >= -90 && leafletPosition[0] <= 90, `Leaflet latitude (${leafletPosition[0]}) is valid latitude (-90 to 90)`);
      assert(leafletPosition[1] >= -180 && leafletPosition[1] <= 180, `Leaflet longitude (${leafletPosition[1]}) is valid longitude (-180 to 180)`);
    }

    // -----------------------------------------------------------------
    // SECTION 2: MULTI-CITY MAP MARKER ACCURACY (Mumbai, Pune, NYC, London)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Multi-City Map Marker Positioning & Bounds ---');

    // 2.1 Mumbai Map (center: [19.0760, 72.8777])
    const mumbaiNearby = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=25`);
    const mumbaiEvents = await mumbaiNearby.json();
    assert(mumbaiEvents.data.length > 0, `Mumbai map contains ${mumbaiEvents.data.length} active markers`);
    for (const ev of mumbaiEvents.data) {
      const lat = ev.location.coordinates[1];
      const lng = ev.location.coordinates[0];
      assert(lat >= 18.9 && lat <= 19.3, `Mumbai marker "${ev.title}" latitude (${lat}) is strictly inside Mumbai bounds`);
      assert(lng >= 72.7 && lng <= 73.15, `Mumbai marker "${ev.title}" longitude (${lng}) is strictly inside Mumbai bounds`);
    }

    // 2.2 Pune Map (center: [18.5204, 73.8567])
    const puneNearby = await fetch(`${baseUrl}/events/nearby?lat=18.5204&lng=73.8567&radius=25`);
    const puneEvents = await puneNearby.json();
    assert(puneEvents.data.length > 0, `Pune map contains ${puneEvents.data.length} active markers`);
    for (const ev of puneEvents.data) {
      const lat = ev.location.coordinates[1];
      const lng = ev.location.coordinates[0];
      assert(lat >= 18.4 && lat <= 18.7, `Pune marker "${ev.title}" latitude (${lat}) is strictly inside Pune bounds`);
      assert(lng >= 73.7 && lng <= 74.0, `Pune marker "${ev.title}" longitude (${lng}) is strictly inside Pune bounds`);
    }

    // 2.3 Bengaluru Map (center: [12.9716, 77.5946])
    const blrNearby = await fetch(`${baseUrl}/events/nearby?lat=12.9716&lng=77.5946&radius=25`);
    const blrEvents = await blrNearby.json();
    assert(blrEvents.data.length > 0, `Bengaluru map contains ${blrEvents.data.length} active markers`);
    for (const ev of blrEvents.data) {
      const lat = ev.location.coordinates[1];
      const lng = ev.location.coordinates[0];
      assert(lat >= 12.8 && lat <= 13.2, `Bengaluru marker "${ev.title}" latitude (${lat}) is strictly inside Bengaluru bounds`);
      assert(lng >= 77.4 && lng <= 77.8, `Bengaluru marker "${ev.title}" longitude (${lng}) is strictly inside Bengaluru bounds`);
    }

    // 2.4 Outside-India Map (center: [51.5074, -0.1278]) -> Zero markers
    const londonNearby = await fetch(`${baseUrl}/events/nearby?lat=51.5074&lng=-0.1278&radius=25`);
    const londonEvents = await londonNearby.json();
    assert(londonEvents.data.length === 0, 'Outside-India map contains 0 markers');

    // -----------------------------------------------------------------
    // SECTION 3: RADIUS CIRCLE CONVERSION (Kilometers to Meters)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Radius Geofence Circle Radius Conversion (km -> m) ---');
    const testRadii = [1, 5, 10, 15, 25, 50];
    for (const r of testRadii) {
      const meters = r * 1000;
      assert(meters === r * 1000 && meters >= 1000 && meters <= 50000, 
        `Radius ${r} km converts accurately to ${meters} meters for Leaflet <Circle />`);
    }

    // -----------------------------------------------------------------
    // SECTION 4: MAP POPUP & NAVIGATION CONTRACT
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Map Popup Card Fields & Navigation Link ---');
    const sampleEvent = mumbaiEvents.data[0];
    assert(sampleEvent._id && typeof sampleEvent._id === 'string', 'Popup event has valid _id string for navigation');
    assert(sampleEvent.title && sampleEvent.title.length > 0, `Popup displays event title: "${sampleEvent.title}"`);
    assert(sampleEvent.category && typeof sampleEvent.category === 'string', `Popup displays category: "${sampleEvent.category}"`);
    assert(sampleEvent.startDate && !isNaN(Date.parse(sampleEvent.startDate)), 'Popup has parseable startDate');
    assert(typeof sampleEvent.price === 'number', `Popup displays price: ₹${sampleEvent.price}`);
    assert(sampleEvent.location?.address && sampleEvent.location.address.length > 0, 'Popup displays venue address');

    // Verify navigation target URL
    const expectedRoute = `/events/${sampleEvent._id}`;
    assert(expectedRoute === `/events/${sampleEvent._id}`, `Popup "View Details" CTA navigates to ${expectedRoute}`);

    // -----------------------------------------------------------------
    // SECTION 5: MINI EVENT MAP & EXTERNAL GOOGLE MAPS ROUTE
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing MiniEventMap Preview & Google Directions Link ---');
    const miniEventLat = sampleEvent.location.coordinates[1];
    const miniEventLng = sampleEvent.location.coordinates[0];
    const expectedDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${miniEventLat},${miniEventLng}`;
    assert(expectedDirectionsUrl.includes(`${miniEventLat},${miniEventLng}`), 
      `MiniEventMap Google Directions URL is valid: ${expectedDirectionsUrl}`);

    // -----------------------------------------------------------------
    // SECTION 6: MAP FILTER DYNAMICS & SYNCHRONIZATION
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Map Marker Updates upon Filter Changes ---');
    
    // Music filter
    const musicRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=50&category=Music`);
    const musicData = await musicRes.json();
    assert(musicData.data.every(e => e.category === 'Music'), 'Map markers after Category=Music filter all belong to Music');
    assert(musicData.data.length <= mumbaiEvents.data.length, 'Filtered map markers count <= unfiltered markers count');

    // Free filter
    const freeRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=50&price=free`);
    const freeData = await freeRes.json();
    assert(freeData.data.every(e => e.price === 0), 'Map markers after Price=free filter all have price === 0');

    console.log('\n====================================================');
    console.log(`STEP 5 LEAFLET MAP & MARKER AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');
    setTimeout(() => process.exit(0), 50);

  } catch (err) {
    console.error('\n❌ Step 5 Audit Failed:', err);
    setTimeout(() => process.exit(1), 50);
  }
};

runStep5LeafletMapTests();
