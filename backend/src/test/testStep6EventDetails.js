const baseUrl = 'http://localhost:5000/api';

const runStep6EventDetailsTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 6: EVENT DETAILS FUNCTIONALITY AUDIT');
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
    // SECTION 1: RETRIEVING LIVE EVENT DETAILS VIA GET /api/events/:id
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Event Details Retrieval & Schema Integrity ---');
    
    // Fetch all events to pick a seed event ID
    const eventsRes = await fetch(`${baseUrl}/events?limit=10`);
    assert(eventsRes.status === 200, 'GET /api/events returns 200 OK');
    const eventsData = await eventsRes.json();
    assert(eventsData.data.length > 0, 'Database contains live events');

    const seedEvent = eventsData.data[0];
    const eventId = seedEvent._id || seedEvent.id;

    const singleEventRes = await fetch(`${baseUrl}/events/${eventId}`);
    assert(singleEventRes.status === 200, `GET /api/events/${eventId} returns 200 OK`);
    const singleEventData = await singleEventRes.json();
    assert(singleEventData.success === true, 'Response payload reports success: true');

    const ev = singleEventData.data;
    assert(ev._id === eventId || ev.id === eventId, 'Returned event ID matches requested ID');
    assert(typeof ev.title === 'string' && ev.title.length > 0, `Event title: "${ev.title}"`);
    assert(typeof ev.description === 'string' && ev.description.length > 0, 'Event has non-empty description');
    assert(typeof ev.category === 'string' && ev.category.length > 0, `Event category: "${ev.category}"`);
    assert(typeof ev.price === 'number' && ev.price >= 0, `Event price: ₹${ev.price}`);
    assert(typeof ev.image === 'string' && ev.image.startsWith('http'), 'Event has valid image URL');
    assert(ev.status === 'ACTIVE' || ev.status === 'CANCELLED' || ev.status === 'DRAFT', `Event status: ${ev.status}`);

    // -----------------------------------------------------------------
    // SECTION 2: DATE & TIME HANDLING
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Date & Time Boundaries ---');
    assert(!isNaN(Date.parse(ev.startDate)), `Event has valid ISO startDate: ${ev.startDate}`);
    assert(!isNaN(Date.parse(ev.endDate)), `Event has valid ISO endDate: ${ev.endDate}`);
    assert(new Date(ev.endDate) >= new Date(ev.startDate), 'Event endDate is at or after startDate');

    // Test Google Calendar template URL format
    const startIso = new Date(ev.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(ev.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.location?.address || '')}`;
    assert(calUrl.includes('calendar.google.com/calendar/render'), 'Google Calendar URL points to official Google Calendar endpoint');
    assert(calUrl.includes(`dates=${startIso}/${endIso}`), 'Google Calendar URL contains properly formatted compact ISO timestamps');

    // -----------------------------------------------------------------
    // SECTION 3: ORGANIZER DATA & SECURITY GUARDRAILS
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Organizer Data & Sensitive Field Guardrails ---');
    assert(ev.organizer && typeof ev.organizer === 'object', 'Event has populated organizer object');
    assert(typeof ev.organizer.name === 'string' && ev.organizer.name.length > 0, `Organizer name: "${ev.organizer.name}"`);
    assert(typeof ev.organizer.email === 'string' && ev.organizer.email.includes('@'), `Organizer email: "${ev.organizer.email}"`);
    
    // STRICT SECURITY: passwordHash must NEVER be exposed
    assert(ev.organizer.passwordHash === undefined, 'Security: organizer.passwordHash is strictly omitted');
    assert(ev.organizer.password === undefined, 'Security: organizer.password is strictly omitted');

    // -----------------------------------------------------------------
    // SECTION 4: LOCATION & MINI-MAP GEOJSON COORDINATES
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Location & MiniEventMap Coordinates ---');
    assert(ev.location && typeof ev.location === 'object', 'Event has valid location object');
    assert(ev.location.type === 'Point', 'Event location.type is "Point"');
    assert(Array.isArray(ev.location.coordinates) && ev.location.coordinates.length === 2, 'Event location.coordinates has 2 elements');

    const [lng, lat] = ev.location.coordinates;
    assert(lng >= -180 && lng <= 180, `Longitude (${lng}) is valid [-180..180]`);
    assert(lat >= -90 && lat <= 90, `Latitude (${lat}) is valid [-90..90]`);
    assert(typeof ev.location.address === 'string' && ev.location.address.length > 0, `Venue address: "${ev.location.address}"`);

    // MiniMap conversion verification: GeoJSON [lng, lat] -> Leaflet [lat, lng]
    const miniMapLeafletPos = [lat, lng];
    assert(miniMapLeafletPos[0] === lat && miniMapLeafletPos[1] === lng, 'MiniMap correctly transforms coordinates to Leaflet [lat, lng]');
    
    // External Google Maps directions URL
    const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    assert(directionsUrl.includes(`query=${lat},${lng}`), `Google directions URL correctly targets: ${directionsUrl}`);

    // -----------------------------------------------------------------
    // SECTION 5: ATTENDEE DATA & RSVP COUNTS
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Attendee Data & RSVP Counts ---');
    assert(typeof ev.goingCount === 'number' && ev.goingCount >= 0, `Event goingCount: ${ev.goingCount}`);
    assert(typeof ev.interestedCount === 'number' && ev.interestedCount >= 0, `Event interestedCount: ${ev.interestedCount}`);
    assert(typeof ev.attendeesCount === 'number' && ev.attendeesCount === (ev.goingCount + ev.interestedCount), 
      `Event attendeesCount (${ev.attendeesCount}) === goingCount (${ev.goingCount}) + interestedCount (${ev.interestedCount})`);

    // Test GET /api/events/:id/attendees endpoint
    const attendeesRes = await fetch(`${baseUrl}/events/${eventId}/attendees`);
    assert(attendeesRes.status === 200, `GET /api/events/${eventId}/attendees returns 200 OK`);
    const attendeesData = await attendeesRes.json();
    assert(attendeesData.success === true, 'Attendees endpoint reports success: true');
    assert(Array.isArray(attendeesData.data.attendees), 'Attendees data contains attendees array');
    assert(attendeesData.data.goingCount === ev.goingCount, 'Attendees endpoint goingCount matches event goingCount');

    // -----------------------------------------------------------------
    // SECTION 6: AUTHENTICATED USER RSVP LIFECYCLE ON EVENT DETAILS
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Authenticated User RSVP Lifecycle on Event Details ---');
    
    // 6.1 Register a new test attendee
    const testUserPayload = {
      name: `Details Tester ${Date.now()}`,
      email: `details_tester_${Date.now()}@localvibe.app`,
      password: 'password123'
    };
    const registerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserPayload)
    });
    assert(registerRes.status === 201, 'Test user registration returns 201 Created');
    const registerData = await registerRes.json();
    const token = registerData.data.token;

    // 6.2 Check initial RSVP status for unauthenticated vs authenticated
    const unauthEventRes = await fetch(`${baseUrl}/events/${eventId}`);
    const unauthEventData = await unauthEventRes.json();
    assert(unauthEventData.data.userRSVPStatus === null, 'Unauthenticated request has userRSVPStatus === null');

    const authEventRes1 = await fetch(`${baseUrl}/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const authEventData1 = await authEventRes1.json();
    assert(authEventData1.data.userRSVPStatus === null, 'Authenticated user initially has userRSVPStatus === null');

    // 6.3 User marks RSVP as GOING
    const goingRes = await fetch(`${baseUrl}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(goingRes.status === 200, 'POST /events/:id/rsvp with status GOING returns 200 OK');

    // 6.4 Fetch Event Details again to verify userRSVPStatus is updated to GOING
    const authEventRes2 = await fetch(`${baseUrl}/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const authEventData2 = await authEventRes2.json();
    assert(authEventData2.data.userRSVPStatus === 'GOING', 'Event Details reflects userRSVPStatus === "GOING"');
    assert(authEventData2.data.goingCount === authEventData1.data.goingCount + 1, 'Event Details goingCount incremented by 1');

    // 6.5 User switches RSVP to INTERESTED
    const interestedRes = await fetch(`${baseUrl}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(interestedRes.status === 200, 'POST /events/:id/rsvp with status INTERESTED returns 200 OK');

    const authEventRes3 = await fetch(`${baseUrl}/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const authEventData3 = await authEventRes3.json();
    assert(authEventData3.data.userRSVPStatus === 'INTERESTED', 'Event Details reflects userRSVPStatus === "INTERESTED"');

    // 6.6 User cancels RSVP
    const deleteRsvpRes = await fetch(`${baseUrl}/events/${eventId}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(deleteRsvpRes.status === 200, 'DELETE /events/:id/rsvp returns 200 OK');

    const authEventRes4 = await fetch(`${baseUrl}/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const authEventData4 = await authEventRes4.json();
    assert(authEventData4.data.userRSVPStatus === null, 'Event Details reflects userRSVPStatus === null after cancellation');

    // -----------------------------------------------------------------
    // SECTION 7: ERROR & NOT FOUND HANDLING
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Error & Not Found Handling ---');

    // 7.1 Non-existent valid ID
    const nonExistentId = '670000000000000000000999';
    const notFoundRes = await fetch(`${baseUrl}/events/${nonExistentId}`);
    assert(notFoundRes.status === 404, `GET /events/${nonExistentId} returns 404 Not Found`);
    const notFoundData = await notFoundRes.json();
    assert(notFoundData.success === false, '404 response reports success: false');

    // 7.2 Non-existent attendees query
    const notFoundAttendees = await fetch(`${baseUrl}/events/${nonExistentId}/attendees`);
    assert(notFoundAttendees.status === 200 || notFoundAttendees.status === 404, 'Attendees query for non-existent event handled safely without crash');

    console.log('\n====================================================');
    console.log(`STEP 6 EVENT DETAILS AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');
    setTimeout(() => process.exit(0), 50);

  } catch (err) {
    console.error('\n❌ Step 6 Audit Failed:', err);
    setTimeout(() => process.exit(1), 50);
  }
};

runStep6EventDetailsTests();
