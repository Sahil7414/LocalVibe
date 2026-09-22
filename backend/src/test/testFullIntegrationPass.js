const baseUrl = 'http://127.0.0.1:5000/api';

const runFullIntegrationCheck = async () => {
  console.log('====================================================');
  console.log('STARTING FULL LOCALVIBE LIVE END-TO-END INTEGRATION CHECK');
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
    // 1. Health Check
    console.log('--- 1. Testing Backend API Health ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns 200 OK');
    assert(healthData.success === true, 'Backend status reports success: true');

    // 2. Discover Events (All + Pagination)
    console.log('\n--- 2. Testing Event Discovery & Filtering ---');
    const eventsRes = await fetch(`${baseUrl}/events?limit=10`);
    const eventsData = await eventsRes.json();
    assert(eventsRes.status === 200, 'GET /events returns 200 OK');
    assert(Array.isArray(eventsData.data), 'GET /events returns an array of events');
    assert(eventsData.data.length > 0, `Database has live seeded events (count: ${eventsData.data.length})`);

    // 3. Geospatial Nearby Discovery (Mumbai lat: 19.076, lng: 72.8777)
    console.log('\n--- 3. Testing Geospatial Queries ($geoWithin / $near) ---');
    const nearbyRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=50`);
    const nearbyData = await nearbyRes.json();
    assert(nearbyRes.status === 200, 'GET /events/nearby returns 200 OK');
    assert(Array.isArray(nearbyData.data), 'Nearby events returned as array');
    assert(nearbyData.data.length > 0, `Found ${nearbyData.data.length} events near Mumbai`);
    
    // Verify coordinate order: GeoJSON [longitude, latitude]
    const firstEvent = nearbyData.data[0];
    assert(Array.isArray(firstEvent.location.coordinates) && firstEvent.location.coordinates.length === 2, 'Coordinates are valid GeoJSON 2-tuple');
    const [lng, lat] = firstEvent.location.coordinates;
    assert(lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90, `Coordinates [${lng}, ${lat}] are in valid geographic range`);

    // 4. Auth: Register New User
    console.log('\n--- 4. Testing User Registration & Authentication ---');
    const timestamp = Date.now();
    const testUserEmail = `integration_tester_${timestamp}@localvibe.app`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration Tester',
        email: testUserEmail,
        password: 'Password123!',
        role: 'USER'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'User registration returns 201 Created');
    assert(regData.data && regData.data.token, 'Registration returns valid JWT auth token');
    const authToken = regData.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    // 5. Auth: Login Check
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'User login returns 200 OK');
    assert(loginData.data.user.email === testUserEmail, 'Logged in user email matches');

    // 6. User Profile Retrieval
    console.log('\n--- 5. Testing Profile & Account Operations ---');
    const profileRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, 'GET /auth/me returns 200 OK');
    const profileUser = profileData.data?.user || profileData.data;
    assert(profileUser.name === 'Integration Tester', 'Profile name matches');

    // 7. Edit Profile
    const updateProfileRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Integration Tester Updated',
        bio: 'Passionate community builder.',
        city: 'Mumbai, Maharashtra'
      })
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, 'PUT /users/me returns 200 OK');
    const updatedUser = updateProfileData.data?.user || updateProfileData.data;
    assert(updatedUser.name === 'Integration Tester Updated', 'Updated name saved in DB');
    assert(updatedUser.bio === 'Passionate community builder.', 'Updated bio saved in DB');

    // 8. Create Event Flow
    console.log('\n--- 6. Testing Event Creation Flow ---');
    const newEventPayload = {
      title: `Koregaon Sunset Jam ${timestamp}`,
      description: 'An acoustic gathering with hot chai and ambient music.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 90000000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [72.8295, 19.0596], // GeoJSON [longitude, latitude]
        address: 'Pali Naka, Bandra West',
        city: 'Mumbai'
      },
      price: 150,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE'
    };

    const createEventRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newEventPayload)
    });
    const createEventData = await createEventRes.json();
    assert(createEventRes.status === 201, 'POST /events returns 201 Created');
    const createdEventId = createEventData.data._id;
    assert(createdEventId, 'Created event has MongoDB _id');

    // 9. Single Event Retrieval
    console.log('\n--- 7. Testing Event Details Retrieval ---');
    const singleEventRes = await fetch(`${baseUrl}/events/${createdEventId}`, { headers: authHeaders });
    const singleEventData = await singleEventRes.json();
    assert(singleEventRes.status === 200, 'GET /events/:id returns 200 OK');
    assert(singleEventData.data.title === newEventPayload.title, 'Event title matches');
    assert(singleEventData.data.price === 150, 'Event price matches');

    // 10. RSVP Lifecycle: Going -> Interested -> Cancel
    console.log('\n--- 8. Testing RSVP Lifecycle ---');
    // 10.1 RSVP to first seeded event as GOING
    const targetEventId = firstEvent._id;
    const rsvpGoingRes = await fetch(`${baseUrl}/events/${targetEventId}/rsvp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ status: 'GOING' })
    });
    const rsvpGoingData = await rsvpGoingRes.json();
    assert(rsvpGoingRes.status === 200, 'POST /events/:id/rsvp (GOING) returns 200 OK');
    assert(rsvpGoingData.data.status === 'GOING', 'RSVP state confirmed as GOING');

    // 10.2 Switch to INTERESTED
    const rsvpInterestedRes = await fetch(`${baseUrl}/events/${targetEventId}/rsvp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    const rsvpInterestedData = await rsvpInterestedRes.json();
    assert(rsvpInterestedRes.status === 200, 'POST /events/:id/rsvp (INTERESTED) returns 200 OK');
    assert(rsvpInterestedData.data.status === 'INTERESTED', 'RSVP state switched to INTERESTED');

    // 11. My Events Integration Check
    console.log('\n--- 9. Testing My Events Hub Integration ---');
    const myEventsRes = await fetch(`${baseUrl}/events/user/my-events`, { headers: authHeaders });
    const myEventsData = await myEventsRes.json();
    assert(myEventsRes.status === 200, 'GET /events/user/my-events returns 200 OK');
    assert(myEventsData.data.counts.interested >= 1, 'My Events includes the Interested RSVP event');
    assert(myEventsData.data.counts.created >= 1, 'My Events includes the Created event');
    assert(myEventsData.data.created.some(e => e._id === createdEventId), 'Newly created event present in My Events created list');

    // 10.3 Cancel RSVP
    const cancelRsvpRes = await fetch(`${baseUrl}/events/${targetEventId}/rsvp`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const cancelRsvpData = await cancelRsvpRes.json();
    assert(cancelRsvpRes.status === 200, 'DELETE /events/:id/rsvp returns 200 OK');
    assert(cancelRsvpData.data.status === null, 'RSVP status cancelled to null');

    // 12. Public Attendees List
    console.log('\n--- 10. Testing Event Attendees Endpoint ---');
    const attendeesRes = await fetch(`${baseUrl}/events/${targetEventId}/attendees`);
    const attendeesData = await attendeesRes.json();
    assert(attendeesRes.status === 200, 'GET /events/:id/attendees returns 200 OK');
    assert(Array.isArray(attendeesData.data?.attendees || attendeesData.data), 'Attendees returned as array');
    assert(typeof attendeesData.data?.goingCount === 'number', 'Event goingCount returned as number');

    console.log('\n====================================================');
    console.log(`FULL INTEGRATION AUDIT PASSED: ${passed}/${total} TESTS SUCCESSFUL!`);
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Integration Audit Failed:', err);
    process.exit(1);
  }
};

runFullIntegrationCheck();
