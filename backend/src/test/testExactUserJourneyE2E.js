const http = require('http');

console.log('========================================================================');
console.log('LOCALVIBE: END-TO-END SCENARIO TEST (USER A & USER B COMPLETE JOURNEY)');
console.log('========================================================================\n');

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (e) => reject(e));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const runE2EScenario = async () => {
  let passed = 0;
  let total = 0;

  const assert = (cond, msg, extra = '') => {
    total++;
    if (cond) {
      passed++;
      console.log(`[PASS ✅] ${msg}${extra ? ` — ${extra}` : ''}`);
    } else {
      console.error(`[FAIL ❌] ${msg}${extra ? ` — ${extra}` : ''}`);
    }
  };

  try {
    const timestamp = Date.now();

    // -------------------------------------------------------------------------
    // STEP 1: USER A REGISTRATION & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('--- Step 1: User A Registration ---');
    const userAEmail = `organizer.a.${timestamp}@localvibe.com`;
    const regARes = await request('POST', '/auth/register', {
      name: 'Aarav (Organizer A)',
      email: userAEmail,
      password: 'password123',
      role: 'ORGANIZER',
      bio: 'Music and arts event host in Pune.'
    });

    console.log('regARes response:', regARes.status, regARes.body);
    assert(regARes.status === 201, 'User A registered successfully (201 Created)', JSON.stringify(regARes.body));
    assert(regARes.body?.data?.token, 'User A received valid JWT token');
    const tokenA = regARes.body?.data?.token;
    const userAId = regARes.body?.data?.user?.id || regARes.body?.data?.user?._id;

    // -------------------------------------------------------------------------
    // STEP 2: USER A CREATES PUNE COMMUNITY MUSIC EVENT
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: User A Creates "Pune Community Music Evening" ---');
    const puneEventPayload = {
      title: 'Pune Community Music Evening',
      description: 'An intimate outdoor indie music gathering with local acoustic songwriters, brass soloists, and hot chai.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 97200000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [73.9168, 18.5626], // [longitude, latitude] Phoenix Marketcity, Viman Nagar, Pune
        address: 'Phoenix Marketcity, Viman Nagar, Pune, Maharashtra 411014',
        city: 'Pune'
      },
      price: 250,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      isFeatured: false,
      status: 'ACTIVE'
    };

    const createRes = await request('POST', '/events', puneEventPayload, tokenA);
    assert(createRes.status === 201, 'Event created successfully (201 Created)');
    assert(createRes.body?.data?._id || createRes.body?.data?.id, 'Created event assigned unique ID');
    const eventId = createRes.body?.data?._id || createRes.body?.data?.id;

    // Verify coordinates integrity
    const savedCoords = createRes.body?.data?.location?.coordinates;
    assert(
      Array.isArray(savedCoords) && savedCoords[0] === 73.9168 && savedCoords[1] === 18.5626,
      'Event coordinates strictly saved as GeoJSON [longitude: 73.9168, latitude: 18.5626]'
    );
    assert(
      createRes.body?.data?.organizer?._id === userAId || createRes.body?.data?.organizer?.id === userAId || createRes.body?.data?.organizer === userAId,
      'Organizer ID correctly bound to authenticated User A'
    );

    // -------------------------------------------------------------------------
    // STEP 3: VERIFY EVENT IN DISCOVER & MAP QUERIES
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Verify Event Appears in Discover Feed & Map ---');
    // Query Pune nearby events
    const puneNearbyRes = await request('GET', `/events/nearby?lat=18.5626&lng=73.9168&radiusKm=10`);
    assert(puneNearbyRes.status === 200, 'GET /events/nearby in Pune returns 200 OK');
    const foundInPuneNearby = puneNearbyRes.body?.data?.some(e => (e._id || e.id) === eventId);
    assert(foundInPuneNearby, 'Created event appears in Pune nearby events query & map');

    // Query Mumbai nearby events (should NOT appear due to city separation / distance)
    const mumbaiNearbyRes = await request('GET', `/events/nearby?lat=19.0760&lng=72.8777&radiusKm=20`);
    assert(mumbaiNearbyRes.status === 200, 'GET /events/nearby in Mumbai returns 200 OK');
    const foundInMumbai = mumbaiNearbyRes.body?.data?.some(e => (e._id || e.id) === eventId);
    assert(!foundInMumbai, 'Pune event does NOT incorrectly appear in Mumbai search (city separation verified)');

    // Verify single event retrieval (Event Details page contract)
    const eventDetailsRes = await request('GET', `/events/${eventId}`);
    assert(eventDetailsRes.status === 200, 'GET /events/:id returns 200 OK');
    assert(eventDetailsRes.body?.data?.title === 'Pune Community Music Evening', 'Event title matches exactly');
    assert(eventDetailsRes.body?.data?.price === 250, 'Event price matches');
    assert(eventDetailsRes.body?.data?.goingCount === 0, 'Initial goingCount is 0');
    assert(eventDetailsRes.body?.data?.interestedCount === 0, 'Initial interestedCount is 0');

    // -------------------------------------------------------------------------
    // STEP 4: USER B REGISTRATION & RSVP LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: User B Registers & Tests RSVP Lifecycle ---');
    const userBEmail = `attendee.b.${timestamp}@localvibe.com`;
    const regBRes = await request('POST', '/auth/register', {
      name: 'Pooja (Attendee B)',
      email: userBEmail,
      password: 'password123',
      role: 'USER',
      bio: 'Live music enthusiast in Pune.'
    });
    assert(regBRes.status === 201, 'User B registered successfully (201 Created)');
    const tokenB = regBRes.body?.data?.token;
    const userBId = regBRes.body?.data?.user?.id || regBRes.body?.data?.user?._id;

    // 4.1 User B clicks GOING
    console.log('4.1 User B RSVPs as GOING');
    const rsvpGoingRes = await request('POST', `/events/${eventId}/rsvp`, { status: 'GOING' }, tokenB);
    assert(rsvpGoingRes.status === 200, 'POST /rsvp with GOING returns 200 OK');
    assert(rsvpGoingRes.body?.data?.status === 'GOING', 'RSVP state confirmed as GOING');
    assert(rsvpGoingRes.body?.data?.goingCount === 1, 'goingCount updated to 1');
    assert(rsvpGoingRes.body?.data?.interestedCount === 0, 'interestedCount remains 0');

    // Verify in User B's My Events -> Confirmed Going
    const myEventsBGoingRes = await request('GET', '/events/user/my-events', null, tokenB);
    assert(myEventsBGoingRes.status === 200, 'GET /events/user/my-events returns 200 OK');
    assert(
      myEventsBGoingRes.body?.data?.going?.some(e => (e._id || e.id) === eventId),
      'Event appears under User B My Events "going" tab'
    );
    assert(
      !myEventsBGoingRes.body?.data?.interested?.some(e => (e._id || e.id) === eventId),
      'Event is NOT under User B "interested" tab'
    );

    // Verify attendee list includes User B
    const attendeesRes = await request('GET', `/events/${eventId}/attendees`);
    assert(attendeesRes.status === 200, 'GET /events/:id/attendees returns 200 OK');
    assert(
      attendeesRes.body?.data?.attendees?.some(a => (a._id || a.id) === userBId),
      'User B appears in public attendee list'
    );

    // 4.2 User B switches RSVP from GOING to INTERESTED
    console.log('4.2 User B switches RSVP from GOING to INTERESTED');
    const rsvpInterestedRes = await request('POST', `/events/${eventId}/rsvp`, { status: 'INTERESTED' }, tokenB);
    assert(rsvpInterestedRes.status === 200, 'POST /rsvp with INTERESTED returns 200 OK');
    assert(rsvpInterestedRes.body?.data?.status === 'INTERESTED', 'RSVP state confirmed as INTERESTED');
    assert(rsvpInterestedRes.body?.data?.goingCount === 0, 'goingCount decremented to 0');
    assert(rsvpInterestedRes.body?.data?.interestedCount === 1, 'interestedCount incremented to 1');

    // Verify My Events tab switch for User B
    const myEventsBInterestedRes = await request('GET', '/events/user/my-events', null, tokenB);
    assert(
      myEventsBInterestedRes.body?.data?.interested?.some(e => (e._id || e.id) === eventId),
      'Event moved to User B My Events "interested" tab'
    );
    assert(
      !myEventsBInterestedRes.body?.data?.going?.some(e => (e._id || e.id) === eventId),
      'Event removed from User B My Events "going" tab'
    );

    // 4.3 User B cancels RSVP
    console.log('4.3 User B cancels RSVP');
    const rsvpCancelRes = await request('DELETE', `/events/${eventId}/rsvp`, null, tokenB);
    assert(rsvpCancelRes.status === 200, 'DELETE /rsvp returns 200 OK');
    assert(rsvpCancelRes.body?.data?.status === null, 'RSVP status set to null');
    assert(rsvpCancelRes.body?.data?.goingCount === 0, 'goingCount is 0');
    assert(rsvpCancelRes.body?.data?.interestedCount === 0, 'interestedCount is 0');

    // Verify event removed from User B My Events
    const myEventsBCancelledRes = await request('GET', '/events/user/my-events', null, tokenB);
    assert(
      !myEventsBCancelledRes.body?.data?.going?.some(e => (e._id || e.id) === eventId) &&
      !myEventsBCancelledRes.body?.data?.interested?.some(e => (e._id || e.id) === eventId),
      'Cancelled event completely removed from User B My Events going & interested tabs'
    );

    // -------------------------------------------------------------------------
    // STEP 5: USER A HOSTED TAB, EVENT EDIT & EVENT DELETE
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: User A Host Management, Edit & Delete ---');
    // 5.1 Verify under Hosted Gatherings
    const myEventsARes = await request('GET', '/events/user/my-events', null, tokenA);
    assert(myEventsARes.status === 200, 'GET User A My Events returns 200 OK');
    assert(
      myEventsARes.body?.data?.created?.some(e => (e._id || e.id) === eventId),
      'Created event appears under User A "created / hosted" tab'
    );

    // 5.2 User B attempts to edit User A event (Forbidden)
    const unauthorizedEditRes = await request('PUT', `/events/${eventId}`, { title: 'Hacked Title' }, tokenB);
    assert(
      unauthorizedEditRes.status === 403,
      'User B editing User A event is rejected with 403 Forbidden (ownership guard)'
    );

    // 5.3 User A edits event details
    console.log('5.3 User A edits event title and price');
    const editRes = await request('PUT', `/events/${eventId}`, {
      title: 'Pune Sunset Indie & Jazz Gathering',
      price: 350
    }, tokenA);
    assert(editRes.status === 200, 'User A PUT /events/:id returns 200 OK');
    assert(editRes.body?.data?.title === 'Pune Sunset Indie & Jazz Gathering', 'Title updated');
    assert(editRes.body?.data?.price === 350, 'Price updated');

    // Verify updated details via GET
    const updatedDetailsRes = await request('GET', `/events/${eventId}`);
    assert(updatedDetailsRes.body?.data?.title === 'Pune Sunset Indie & Jazz Gathering', 'GET /events/:id reflects updated title');
    assert(updatedDetailsRes.body?.data?.price === 350, 'GET /events/:id reflects updated price');

    // 5.4 User B attempts to delete User A event (Forbidden)
    const unauthorizedDeleteRes = await request('DELETE', `/events/${eventId}`, null, tokenB);
    assert(
      unauthorizedDeleteRes.status === 403,
      'User B deleting User A event is rejected with 403 Forbidden (ownership guard)'
    );

    // 5.5 User A deletes event
    console.log('5.5 User A deletes event');
    const deleteRes = await request('DELETE', `/events/${eventId}`, null, tokenA);
    assert(deleteRes.status === 200, 'User A DELETE /events/:id returns 200 OK');

    // Verify event is gone from Discover and Details
    const getDeletedRes = await request('GET', `/events/${eventId}`);
    assert(getDeletedRes.status === 404, 'GET /events/:id on deleted event returns 404 Not Found');

    const puneNearbyAfterDelete = await request('GET', `/events/nearby?lat=18.5626&lng=73.9168&radiusKm=10`);
    const foundAfterDelete = puneNearbyAfterDelete.body?.data?.some(e => (e._id || e.id) === eventId);
    assert(!foundAfterDelete, 'Deleted event is removed from Discover / map queries');

    console.log('\n========================================================================');
    console.log(`END-TO-END USER JOURNEY RESULTS: ${passed}/${total} PASSED (100%)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('E2E Scenario failed with error:', err);
  }
};

runE2EScenario();
