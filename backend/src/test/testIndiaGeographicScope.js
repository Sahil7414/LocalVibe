const baseUrl = 'http://localhost:5000/api';
const { isLocationInIndia, validateEventInput, validateUpdateEventInput } = require('../validators/eventValidator');

const runIndiaGeographicScopeTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE: INDIA-ONLY GEOGRAPHIC SCOPE AUDIT');
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
    // SECTION 1: SEED DATA INDIA-ONLY VERIFICATION
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Seed Event Data (India-Only) ---');
    const allEventsRes = await fetch(`${baseUrl}/events?limit=50`);
    assert(allEventsRes.status === 200, 'GET /api/events returns 200 OK');
    const allEventsData = await allEventsRes.json();
    assert(allEventsData.success === true, 'Response reports success: true');
    assert(allEventsData.data.length > 0, `Database contains ${allEventsData.data.length} demonstration events`);

    const knownIndianCities = ['mumbai', 'pune', 'thane', 'navi mumbai', 'bengaluru', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad', 'jaipur'];

    for (const ev of allEventsData.data) {
      const [lng, lat] = ev.location.coordinates;
      assert(isLocationInIndia(lng, lat), `Event "${ev.title}" coordinates [${lng}, ${lat}] fall strictly within India bounds`);
      assert(lat >= 6.0 && lat <= 38.0, `Event "${ev.title}" latitude (${lat}) is within [6.0, 38.0]`);
      assert(lng >= 68.0 && lng <= 98.0, `Event "${ev.title}" longitude (${lng}) is within [68.0, 98.0]`);
      
      const cityLower = (ev.location.city || '').toLowerCase();
      assert(
        knownIndianCities.some(c => cityLower.includes(c)),
        `Event "${ev.title}" city ("${ev.location.city}") is a valid Indian city`
      );

      // Verify no traces of New York or London
      assert(!cityLower.includes('new york') && !cityLower.includes('london'), `Event "${ev.title}" is NOT in New York or London`);
      assert(!ev.location.address.toLowerCase().includes('new york') && !ev.location.address.toLowerCase().includes('london'), `Event "${ev.title}" address contains no foreign cities`);
    }

    // -----------------------------------------------------------------
    // SECTION 2: BACKEND INDIA-ONLY VALIDATION (CREATION)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Backend Location Validation on Creation ---');

    // Register test user
    const timestamp = Date.now();
    const testUserEmail = `organizer_india_${timestamp}@localvibe.app`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Hegde',
        email: testUserEmail,
        password: 'password123',
        role: 'ORGANIZER'
      })
    });
    assert(regRes.status === 201, 'Test organizer registered successfully (201 Created)');
    const regData = await regRes.json();
    const token = regData.data.token;

    // 2.1 Attempt to create an event in London (Should fail: 400 Bad Request)
    const londonCreateRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Trafalgar Square Flash Mob',
        description: 'London gathering in the square',
        category: 'Entertainment',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        price: 0,
        location: {
          address: 'Trafalgar Square, London',
          city: 'London',
          coordinates: [-0.1281, 51.5080] // London coordinates
        }
      })
    });
    assert(londonCreateRes.status === 400, 'POST /api/events with London coordinates rejected with 400 Bad Request');
    const londonCreateData = await londonCreateRes.json();
    assert(londonCreateData.success === false, 'London event rejection reports success: false');
    assert(
      londonCreateData.errors.some(e => e.includes('India')),
      'Validation error explicitly mentions India geographic boundary'
    );

    // 2.2 Attempt to create an event in New York (Should fail: 400 Bad Request)
    const nycCreateRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Times Square Tech Showcase',
        description: 'Broadway demo',
        category: 'Workshops',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        price: 100,
        location: {
          address: 'Times Square, New York, NY',
          city: 'New York',
          coordinates: [-73.9851, 40.7580] // NYC coordinates
        }
      })
    });
    assert(nycCreateRes.status === 400, 'POST /api/events with NYC coordinates rejected with 400 Bad Request');

    // 2.3 Create a valid Indian event in Bengaluru (Should succeed: 201 Created)
    const blrCreateRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Koramangala Startup Chai & Pitch Morning',
        description: 'Early morning coffee, chai, and seed pitch deck discussions in Koramangala.',
        category: 'Social',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        price: 0,
        location: {
          address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
          city: 'Bengaluru',
          coordinates: [77.6245, 12.9352] // Bengaluru coordinates
        }
      })
    });
    assert(blrCreateRes.status === 201, 'POST /api/events with Bengaluru coordinates accepted (201 Created)');
    const blrCreateData = await blrCreateRes.json();
    assert(blrCreateData.success === true, 'Bengaluru event creation reports success: true');
    const createdEventId = blrCreateData.data._id || blrCreateData.data.id;

    // -----------------------------------------------------------------
    // SECTION 3: BACKEND INDIA-ONLY VALIDATION (UPDATE)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Backend Location Validation on Update ---');

    // 3.1 Attempt to update event location to Paris (Should fail: 400 Bad Request)
    const parisUpdateRes = await fetch(`${baseUrl}/events/${createdEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        location: {
          address: 'Eiffel Tower, Paris, France',
          city: 'Paris',
          coordinates: [2.2945, 48.8584] // Paris coordinates
        }
      })
    });
    assert(parisUpdateRes.status === 400, 'PUT /api/events/:id with Paris coordinates rejected with 400 Bad Request');
    const parisUpdateData = await parisUpdateRes.json();
    assert(parisUpdateData.errors.some(e => e.includes('India')), 'Update error mentions India boundary');

    // 3.2 Update event with valid Indian coordinates in Delhi (Should succeed: 200 OK)
    const delhiUpdateRes = await fetch(`${baseUrl}/events/${createdEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Connaught Place Heritage Coffee Walk',
        location: {
          address: 'Inner Circle, Connaught Place, New Delhi',
          city: 'Delhi',
          coordinates: [77.2197, 28.6315] // Delhi coordinates
        }
      })
    });
    assert(delhiUpdateRes.status === 200, 'PUT /api/events/:id with Delhi coordinates accepted (200 OK)');
    const delhiUpdateData = await delhiUpdateRes.json();
    assert(delhiUpdateData.data.title === 'Connaught Place Heritage Coffee Walk', 'Event title updated');
    assert(delhiUpdateData.data.location.city === 'Delhi', 'Event city updated to Delhi');

    // -----------------------------------------------------------------
    // SECTION 4: NEARBY DISCOVERY & OUTSIDE-INDIA BEHAVIOR
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Nearby Discovery & Non-Indian Coordinate Isolation ---');

    // 4.1 Mumbai Nearby
    const mumbaiRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=25`);
    const mumbaiData = await mumbaiRes.json();
    assert(mumbaiRes.status === 200, 'GET /api/events/nearby for Mumbai returns 200 OK');
    assert(mumbaiData.data.length > 0, `Discovered ${mumbaiData.data.length} Mumbai events`);
    assert(mumbaiData.data.every(e => isLocationInIndia(e.location.coordinates[0], e.location.coordinates[1])), 'All Mumbai events are in India');

    // 4.2 Pune Nearby
    const puneRes = await fetch(`${baseUrl}/events/nearby?lat=18.5204&lng=73.8567&radius=25`);
    const puneData = await puneRes.json();
    assert(puneRes.status === 200, 'GET /api/events/nearby for Pune returns 200 OK');
    assert(puneData.data.length > 0, `Discovered ${puneData.data.length} Pune events`);

    // 4.3 Bengaluru Nearby
    const blrRes = await fetch(`${baseUrl}/events/nearby?lat=12.9716&lng=77.5946&radius=25`);
    const blrData = await blrRes.json();
    assert(blrRes.status === 200, 'GET /api/events/nearby for Bengaluru returns 200 OK');
    assert(blrData.data.length > 0, `Discovered ${blrData.data.length} Bengaluru events`);

    // 4.4 Non-Indian Coordinates (e.g. Sydney, Tokyo, London, NYC) -> Must return 0 events
    const sydneyRes = await fetch(`${baseUrl}/events/nearby?lat=-33.8688&lng=151.2093&radius=50`);
    const sydneyData = await sydneyRes.json();
    assert(sydneyRes.status === 200, 'GET /api/events/nearby for Sydney returns 200 OK');
    assert(sydneyData.data.length === 0, 'Sydney search returns 0 events');

    const tokyoRes = await fetch(`${baseUrl}/events/nearby?lat=35.6762&lng=139.6503&radius=50`);
    const tokyoData = await tokyoRes.json();
    assert(tokyoRes.status === 200, 'GET /api/events/nearby for Tokyo returns 200 OK');
    assert(tokyoData.data.length === 0, 'Tokyo search returns 0 events');

    // -----------------------------------------------------------------
    // SECTION 5: BOUNDARY FUNCTION ACCURACY
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Geographic Boundary Function Accuracy ---');
    assert(isLocationInIndia(72.8777, 19.0760) === true, 'Mumbai (72.8777, 19.0760) is in India');
    assert(isLocationInIndia(77.5946, 12.9716) === true, 'Bengaluru (77.5946, 12.9716) is in India');
    assert(isLocationInIndia(77.1025, 28.7041) === true, 'Delhi (77.1025, 28.7041) is in India');
    assert(isLocationInIndia(78.4867, 17.3850) === true, 'Hyderabad (78.4867, 17.3850) is in India');
    assert(isLocationInIndia(92.7918, 11.6234) === true, 'Port Blair, Andaman (92.7918, 11.6234) is in India');
    assert(isLocationInIndia(74.8560, 32.7266) === true, 'Jammu (74.8560, 32.7266) is in India');
    assert(isLocationInIndia(-74.0060, 40.7128) === false, 'New York (-74.0060, 40.7128) is NOT in India');
    assert(isLocationInIndia(-0.1278, 51.5074) === false, 'London (-0.1278, 51.5074) is NOT in India');
    assert(isLocationInIndia(55.2708, 25.2048) === false, 'Dubai (55.2708, 25.2048) is NOT in India');

    console.log('\n====================================================');
    console.log(`INDIA-ONLY GEOGRAPHIC SCOPE AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ India Geographic Scope Audit Failed:', error);
    process.exit(1);
  }
};

runIndiaGeographicScopeTests();
