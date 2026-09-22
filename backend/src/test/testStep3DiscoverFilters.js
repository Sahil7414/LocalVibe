const baseUrl = 'http://localhost:5000/api';

const runStep3DiscoverFilterTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 3: DISCOVER, SEARCH & FILTERS AUDIT');
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
    // SECTION 1: INITIAL DISCOVER LOAD & DATA INTEGRITY
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Initial Discover Retrieval & Schema Integrity ---');
    const mumbaiLat = 19.0760;
    const mumbaiLng = 72.8777;

    const initialNearbyRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50`);
    assert(initialNearbyRes.status === 200, 'GET /api/events/nearby returns 200 OK');
    const initialNearbyData = await initialNearbyRes.json();
    assert(initialNearbyData.success === true, 'Response payload reports success: true');
    assert(Array.isArray(initialNearbyData.data) && initialNearbyData.data.length > 0, `Returns live events from database (count: ${initialNearbyData.data.length})`);
    
    // Validate event data structure
    const sampleEvent = initialNearbyData.data[0];
    assert(sampleEvent._id && typeof sampleEvent._id === 'string', 'Event has valid MongoDB _id string');
    assert(typeof sampleEvent.title === 'string' && sampleEvent.title.length > 0, 'Event has valid title');
    assert(typeof sampleEvent.category === 'string', 'Event has valid category taxonomy');
    assert(typeof sampleEvent.price === 'number', 'Event has valid numeric price');
    assert(Array.isArray(sampleEvent.location?.coordinates) && sampleEvent.location.coordinates.length === 2, 'Event location has GeoJSON coordinates');
    assert(typeof sampleEvent.distanceKm === 'number', `Event includes computed Haversine distance in km (${sampleEvent.distanceKm} km)`);

    // -----------------------------------------------------------------
    // SECTION 2: SEARCH CAPABILITIES
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Text Search (Title, Partial, Case-Insensitive, Venue) ---');

    // 2.1 Search by Partial Title (using title word from sampleEvent)
    const searchTerm = sampleEvent.title.split(' ')[0];
    const searchRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&search=${encodeURIComponent(searchTerm)}`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, `GET /events/nearby with ?search=${searchTerm} returns 200 OK`);
    assert(searchData.data.length > 0, `Search finds matching events (count: ${searchData.data.length})`);
    assert(searchData.data.every(e => 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location.address && e.location.address.toLowerCase().includes(searchTerm.toLowerCase()))
    ), `All search results contain search term "${searchTerm}" in title, description or address`);

    // 2.2 Case-Insensitive Search (e.g., mIXeD CaSe)
    const mixedCaseTerm = searchTerm.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
    const searchCaseRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&search=${encodeURIComponent(mixedCaseTerm)}`);
    const searchCaseData = await searchCaseRes.json();
    assert(searchCaseData.data.length === searchData.data.length, `Search is case-insensitive (returns identical count for "${mixedCaseTerm}")`);

    // 2.3 Search with No Match
    const noMatchRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&search=xyz_completely_nonexistent_term_999`);
    const noMatchData = await noMatchRes.json();
    assert(noMatchRes.status === 200, 'Search with no matches returns 200 OK');
    assert(noMatchData.data.length === 0, 'Search with no matches returns empty array []');

    // -----------------------------------------------------------------
    // SECTION 3: CATEGORY FILTERING
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Category Filter Taxonomy ---');

    const musicCategoryRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&category=Music`);
    const musicCategoryData = await musicCategoryRes.json();
    assert(musicCategoryRes.status === 200, 'GET /events/nearby?category=Music returns 200 OK');
    assert(musicCategoryData.data.length > 0, `Found ${musicCategoryData.data.length} Music events`);
    assert(musicCategoryData.data.every(e => e.category === 'Music'), 'All returned events have category strictly equal to "Music"');

    // -----------------------------------------------------------------
    // SECTION 3.5: DATE FILTERING
    // -----------------------------------------------------------------
    console.log('\n--- 3.5. Testing Date Filtering (today, tomorrow, weekend, upcoming) ---');

    const upcomingRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&date=upcoming`);
    const upcomingData = await upcomingRes.json();
    assert(upcomingRes.status === 200, 'GET /events/nearby?date=upcoming returns 200 OK');
    assert(Array.isArray(upcomingData.data), 'Upcoming date filter returns array');

    const todayRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&date=today`);
    assert(todayRes.status === 200, 'GET /events/nearby?date=today returns 200 OK');

    const tomorrowRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&date=tomorrow`);
    assert(tomorrowRes.status === 200, 'GET /events/nearby?date=tomorrow returns 200 OK');

    const weekendRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&date=weekend`);
    assert(weekendRes.status === 200, 'GET /events/nearby?date=weekend returns 200 OK');

    // -----------------------------------------------------------------
    // SECTION 4: DISTANCE / RADIUS FILTERING
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Distance / Radius Geospatial Filtering ---');

    // 4.1 Small Radius (5 km)
    const smallRadiusRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=5`);
    const smallRadiusData = await smallRadiusRes.json();
    assert(smallRadiusRes.status === 200, 'GET /events/nearby?radius=5 returns 200 OK');
    assert(smallRadiusData.data.every(e => e.distanceKm <= 5), 'All events in 5 km search have distanceKm <= 5 km');

    // 4.2 Medium Radius (25 km)
    const mediumRadiusRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=25`);
    const mediumRadiusData = await mediumRadiusRes.json();
    assert(mediumRadiusRes.status === 200, 'GET /events/nearby?radius=25 returns 200 OK');
    assert(mediumRadiusData.data.every(e => e.distanceKm <= 25), 'All events in 25 km search have distanceKm <= 25 km');
    assert(mediumRadiusData.data.length >= smallRadiusData.data.length, '25 km search returns >= events than 5 km search');

    // 4.3 Large Radius (50 km)
    const largeRadiusRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50`);
    const largeRadiusData = await largeRadiusRes.json();
    assert(largeRadiusRes.status === 200, 'GET /events/nearby?radius=50 returns 200 OK');
    assert(largeRadiusData.data.every(e => e.distanceKm <= 50), 'All events in 50 km search have distanceKm <= 50 km');

    // -----------------------------------------------------------------
    // SECTION 5: PRICE FILTERING
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Price Filtering (Free vs Paid) ---');

    // 5.1 Free Events
    const freeRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&price=free`);
    const freeData = await freeRes.json();
    assert(freeRes.status === 200, 'GET /events/nearby?price=free returns 200 OK');
    assert(freeData.data.every(e => e.price === 0), 'All returned free events have price === 0');

    // 5.2 Paid Events
    const paidRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&price=paid`);
    const paidData = await paidRes.json();
    assert(paidRes.status === 200, 'GET /events/nearby?price=paid returns 200 OK');
    assert(paidData.data.every(e => e.price > 0), 'All returned paid events have price > 0');

    // -----------------------------------------------------------------
    // SECTION 6: COMBINED MULTI-FILTERS
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Multi-Filter Logical Intersection ---');

    // Combination: Music + 50km + Paid
    const comboRes = await fetch(`${baseUrl}/events/nearby?lat=${mumbaiLat}&lng=${mumbaiLng}&radius=50&category=Music&price=paid`);
    const comboData = await comboRes.json();
    assert(comboRes.status === 200, 'Combined query (Category=Music + Price=paid + Radius=50km) returns 200 OK');
    assert(comboData.data.every(e => e.category === 'Music' && e.price > 0 && e.distanceKm <= 50), 
      'Every event in combined result satisfies ALL 3 filter criteria simultaneously');

    // -----------------------------------------------------------------
    // SECTION 7: FEATURED FILTERING
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Featured Events Filtering ---');
    const featuredRes = await fetch(`${baseUrl}/events?featured=true`);
    const featuredData = await featuredRes.json();
    assert(featuredRes.status === 200, 'GET /events?featured=true returns 200 OK');
    assert(featuredData.data.every(e => e.isFeatured === true), 'All events returned have isFeatured === true');

    // -----------------------------------------------------------------
    // SECTION 8: PARAMETER VALIDATION & ERROR HANDLING
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testing Geospatial Parameter Validation & Error Handling ---');

    // Missing lat/lng
    const missingCoordsRes = await fetch(`${baseUrl}/events/nearby`);
    assert(missingCoordsRes.status === 400, 'GET /events/nearby without lat/lng returns 400 Bad Request');

    // Out-of-bounds Latitude (> 90)
    const invalidLatRes = await fetch(`${baseUrl}/events/nearby?lat=95&lng=72.8777`);
    assert(invalidLatRes.status === 400, 'Invalid latitude (95) returns 400 Bad Request');

    // Out-of-bounds Longitude (> 180)
    const invalidLngRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=200`);
    assert(invalidLngRes.status === 400, 'Invalid longitude (200) returns 400 Bad Request');

    console.log('\n====================================================');
    console.log(`STEP 3 DISCOVER, SEARCH & FILTERS AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Step 3 Audit Failed:', err);
    process.exit(1);
  }
};

runStep3DiscoverFilterTests();
