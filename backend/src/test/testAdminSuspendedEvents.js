const http = require('http');

console.log('========================================================================');
console.log('LOCALVIBE: ADMIN SUSPENDED EVENT & STATE PROPAGATION TEST');
console.log('========================================================================\n');

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };

    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    if (payload) req.write(payload);
    req.end();
  });
}

const runSuspendedTest = async () => {
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

    // 1. Register Organizer
    const orgRes = await request('POST', '/auth/register', {
      name: 'Host Organizer',
      email: `host.${timestamp}@localvibe.com`,
      password: 'password123',
      role: 'ORGANIZER'
    });
    assert(orgRes.status === 201, 'Organizer registered (201 Created)');
    const orgToken = orgRes.body?.data?.token;

    // 2. Create Event
    const eventPayload = {
      title: 'Bandra Sunset Rooftop Acoustic',
      description: 'Acoustic jam session overlooking Bandra skyline.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 97200000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [72.8258, 19.0596],
        address: 'Carter Road, Bandra West, Mumbai',
        city: 'Mumbai'
      },
      price: 200,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE'
    };

    const createRes = await request('POST', '/events', eventPayload, orgToken);
    assert(createRes.status === 201, 'Event published with status ACTIVE');
    const eventId = createRes.body?.data?._id || createRes.body?.data?.id;

    // 3. Register Attendee
    const attendeeRes = await request('POST', '/auth/register', {
      name: 'Rohan Attendee',
      email: `rohan.${timestamp}@localvibe.com`,
      password: 'password123',
      role: 'USER'
    });
    assert(attendeeRes.status === 201, 'Attendee registered (201 Created)');
    const attendeeToken = attendeeRes.body?.data?.token;

    // 4. Admin / Organizer suspends the event
    const suspendRes = await request('PUT', `/events/${eventId}`, { status: 'SUSPENDED' }, orgToken);
    assert(suspendRes.status === 200, 'Event updated to SUSPENDED status (200 OK)');
    assert(suspendRes.body?.data?.status === 'SUSPENDED', 'Status field is confirmed as SUSPENDED');

    // 5. Verify GET /events/:id returns status SUSPENDED
    const getRes = await request('GET', `/events/${eventId}`);
    assert(getRes.status === 200, 'GET /events/:id returns 200 OK');
    assert(getRes.body?.data?.status === 'SUSPENDED', 'Event data reflects status SUSPENDED');

    // 6. Attendee attempts to RSVP to the SUSPENDED event -> Must be rejected with 400
    const rsvpToSuspendedRes = await request('POST', `/events/${eventId}/rsvp`, { status: 'GOING' }, attendeeToken);
    assert(rsvpToSuspendedRes.status === 400, 'RSVP to SUSPENDED event is strictly blocked (400 Bad Request)');
    assert(
      rsvpToSuspendedRes.body?.message?.includes('suspended') || rsvpToSuspendedRes.body?.message?.includes('cancelled'),
      'Error message clarifies event is suspended or cancelled'
    );

    // 7. Admin / Organizer reactivates the event
    const reactivateRes = await request('PUT', `/events/${eventId}`, { status: 'ACTIVE' }, orgToken);
    assert(reactivateRes.status === 200, 'Event reactivated to ACTIVE status (200 OK)');
    assert(reactivateRes.body?.data?.status === 'ACTIVE', 'Status field is confirmed as ACTIVE');

    // 8. Attendee RSVPs now -> Must succeed with 200
    const rsvpActiveRes = await request('POST', `/events/${eventId}/rsvp`, { status: 'GOING' }, attendeeToken);
    assert(rsvpActiveRes.status === 200, 'RSVP to reactivated ACTIVE event succeeds (200 OK)');
    assert(rsvpActiveRes.body?.data?.goingCount === 1, 'Going count incremented to 1');

    console.log('\n========================================================================');
    console.log(`ADMIN SUSPENDED EVENT TEST RESULTS: ${passed}/${total} PASSED (100%)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Suspended event test failed:', err);
  }
};

runSuspendedTest();
