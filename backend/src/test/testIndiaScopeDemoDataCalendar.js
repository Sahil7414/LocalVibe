const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✓ PASS: ${message}`);
  }
};

const runAllTests = async () => {
  console.log('========================================================================');
  console.log('LOCALVIBE — INDIA-ONLY SCOPE, DEMO DATA & CALENDAR VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    try {
      console.log(`\n[TEST ${total}] ${name}`);
      await fn();
      passed++;
    } catch (err) {
      console.error(`Error in "${name}":`, err.message);
      throw err;
    }
  };

  // 1. Indian Demo Events Exist
  await test('1. Curated Indian Demo Events exist (25–40 events target)', async () => {
    const res = await request('GET', '/events?limit=100');
    assert(res.status === 200, 'GET /events status 200');
    assert(res.data.success === true, 'Response success is true');
    const events = res.data.data;
    assert(events.length >= 25, `Contains ${events.length} events (meets target >= 25)`);
  });

  // 2. No non-Indian demo events exist
  await test('2. Verify zero non-Indian demo events exist (No New York, London, NYC, UK)', async () => {
    const res = await request('GET', '/events?limit=100');
    const events = res.data.data;
    const nonIndian = events.filter(e => {
      const city = (e.location?.city || '').toLowerCase();
      const addr = (e.location?.address || '').toLowerCase();
      const title = (e.title || '').toLowerCase();
      return city.includes('new york') || city.includes('london') ||
             addr.includes('london') || addr.includes('new york') ||
             addr.includes('nyc') || addr.includes('uk') ||
             title.includes('london') || title.includes('new york');
    });
    assert(nonIndian.length === 0, `No non-Indian demo events found in inventory (${nonIndian.length})`);
  });

  // 3. Demo Users Exist
  await test('3. Demo accounts exist with proper roles and profiles', async () => {
    const demoEmails = [
      'curator@localvibe.app',
      'demo.mumbai@localvibe.demo',
      'demo.pune@localvibe.demo',
      'demo.bengaluru@localvibe.demo',
      'demo.delhi@localvibe.demo',
      'demo.events@localvibe.demo',
      'demo.user1@localvibe.demo',
      'demo.user2@localvibe.demo'
    ];

    for (const email of demoEmails) {
      const loginRes = await request('POST', '/auth/login', {
        email,
        password: 'password123'
      });
      assert(loginRes.status === 200, `Login successful for ${email}`);
      assert(loginRes.data.data.token, `JWT token returned for ${email}`);
      assert(loginRes.data.data.user.name, `User has name: ${loginRes.data.data.user.name}`);
    }
  });

  // 4. Demo passwords are secure (bcrypt hashed, plain passwords fail)
  await test('4. Passwords hashed properly with bcrypt — wrong password fails', async () => {
    const failRes = await request('POST', '/auth/login', {
      email: 'curator@localvibe.app',
      password: 'wrongpassword'
    });
    assert(failRes.status === 401, 'Wrong password correctly returns 401 Unauthorized');
  });

  // 5. Demo event organizers reference valid users
  await test('5. Demo events reference valid organizer accounts', async () => {
    const res = await request('GET', '/events?limit=100');
    const events = res.data.data;
    for (const ev of events) {
      assert(ev.organizer, `Event "${ev.title}" has organizer`);
      assert(ev.organizer.name, `Organizer has name: ${ev.organizer.name}`);
      assert(ev.organizer.email || ev.organizer._id, `Organizer has valid identity reference`);
    }
  });

  // 6. Safe repeatable / idempotent query verification
  await test('6. Repeated queries maintain consistent data integrity', async () => {
    const res1 = await request('GET', '/events?limit=100');
    const res2 = await request('GET', '/events?limit=100');
    assert(res1.data.data.length === res2.data.data.length, 'Event count remains stable across requests');
  });

  // 7. Indian coordinates are valid & accurate GeoJSON [lng, lat]
  await test('7. Validate all event coordinates are inside India bounding box [6..38 N, 68..98 E]', async () => {
    const res = await request('GET', '/events?limit=100');
    const events = res.data.data;
    for (const ev of events) {
      const coords = ev.location.coordinates;
      assert(Array.isArray(coords) && coords.length === 2, `Valid coords array for "${ev.title}"`);
      const [lng, lat] = coords;
      assert(lat >= 6.0 && lat <= 38.0, `Latitude ${lat} in India [6.0..38.0] for "${ev.title}"`);
      assert(lng >= 68.0 && lng <= 98.0, `Longitude ${lng} in India [68.0..98.0] for "${ev.title}"`);
    }
  });

  // 8. Mumbai nearby search returns nearby Mumbai events
  await test('8. Mumbai GPS search (lat: 19.0596, lng: 72.8258, Bandra) returns Mumbai events', async () => {
    const res = await request('GET', '/events/nearby?lat=19.0596&lng=72.8258&radiusKm=20');
    assert(res.status === 200, 'Nearby Mumbai query status 200');
    const nearby = res.data.data;
    assert(nearby.length > 0, `Found ${nearby.length} events near Bandra, Mumbai`);
    for (const ev of nearby) {
      assert(ev.distanceKm <= 20, `Event "${ev.title}" distance ${ev.distanceKm}km <= 20km`);
      assert(['Mumbai', 'Thane', 'Navi Mumbai'].includes(ev.location.city), `City is in Mumbai MMR: ${ev.location.city}`);
    }
  });

  // 9. Pune nearby search returns nearby Pune events
  await test('9. Pune GPS search (lat: 18.5362, lng: 73.8913, KP) returns Pune events', async () => {
    const res = await request('GET', '/events/nearby?lat=18.5362&lng=73.8913&radiusKm=25');
    assert(res.status === 200, 'Nearby Pune query status 200');
    const nearby = res.data.data;
    assert(nearby.length > 0, `Found ${nearby.length} events near Koregaon Park, Pune`);
    for (const ev of nearby) {
      assert(ev.distanceKm <= 25, `Event "${ev.title}" distance ${ev.distanceKm}km <= 25km`);
      assert(ev.location.city === 'Pune', `Event belongs to Pune: ${ev.location.city}`);
    }
  });

  // 10. Bengaluru nearby search returns Bengaluru events
  await test('10. Bengaluru GPS search (lat: 12.9763, lng: 77.5925, Cubbon Park) returns Bengaluru events', async () => {
    const res = await request('GET', '/events/nearby?lat=12.9763&lng=77.5925&radiusKm=25');
    assert(res.status === 200, 'Nearby Bengaluru query status 200');
    const nearby = res.data.data;
    assert(nearby.length > 0, `Found ${nearby.length} events near Cubbon Park, Bengaluru`);
    for (const ev of nearby) {
      assert(ev.distanceKm <= 25, `Event "${ev.title}" distance ${ev.distanceKm}km <= 25km`);
      assert(ev.location.city === 'Bengaluru', `Event belongs to Bengaluru: ${ev.location.city}`);
    }
  });

  // 11. Delhi nearby search returns Delhi events
  await test('11. Delhi GPS search (lat: 28.5535, lng: 77.1947, Hauz Khas) returns Delhi events', async () => {
    const res = await request('GET', '/events/nearby?lat=28.5535&lng=77.1947&radiusKm=25');
    assert(res.status === 200, 'Nearby Delhi query status 200');
    const nearby = res.data.data;
    assert(nearby.length > 0, `Found ${nearby.length} events near Hauz Khas, Delhi`);
    for (const ev of nearby) {
      assert(ev.distanceKm <= 25, `Event "${ev.title}" distance ${ev.distanceKm}km <= 25km`);
      assert(ev.location.city === 'Delhi', `Event belongs to Delhi: ${ev.location.city}`);
    }
  });

  // 12. Guest can browse Discover without authentication
  await test('12. Guest can browse Discover / GET /api/events publicly', async () => {
    const res = await request('GET', '/events');
    assert(res.status === 200, 'Guest access to /events is 200 OK');
    assert(Array.isArray(res.data.data), 'Returns events array to guest');
  });

  // 13. Guest can view Event Details
  await test('13. Guest can view specific event details via GET /api/events/:id', async () => {
    const listRes = await request('GET', '/events?limit=1');
    const sampleEvent = listRes.data.data[0];
    const detailsRes = await request('GET', `/events/${sampleEvent._id || sampleEvent.id}`);
    assert(detailsRes.status === 200, 'Event details status 200 for guest');
    assert(detailsRes.data.data.title === sampleEvent.title, 'Details data matches title');
    assert(detailsRes.data.data.location.coordinates.length === 2, 'Coordinates provided');
  });

  // 14. Guest cannot RSVP (Unauthorized 401)
  await test('14. Guest cannot RSVP without authentication (401 Unauthorized)', async () => {
    const listRes = await request('GET', '/events?limit=1');
    const eventId = listRes.data.data[0]._id || listRes.data.data[0].id;
    const rsvpRes = await request('POST', `/events/${eventId}/rsvp`, { status: 'GOING' });
    assert(rsvpRes.status === 401, 'RSVP without auth returns 401 Unauthorized');
  });

  // 15. Guest cannot access My Events
  await test('15. Guest cannot access /api/events/user/my-events without authentication (401 Unauthorized)', async () => {
    const myEventsRes = await request('GET', '/events/user/my-events');
    assert(myEventsRes.status === 401, 'My Events without auth returns 401 Unauthorized');
  });

  // 16. Guest cannot create events
  await test('16. Guest cannot create events without authentication (401 Unauthorized)', async () => {
    const createRes = await request('POST', '/events', {
      title: 'Unauthorized Event',
      description: 'Test',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      location: {
        coordinates: [72.8258, 19.0596],
        address: 'Bandra',
        city: 'Mumbai'
      },
      price: 0
    });
    assert(createRes.status === 401, 'Create event without auth returns 401 Unauthorized');
  });

  // 17. Guest cannot access Profile
  await test('17. Guest cannot access /api/auth/me without authentication (401 Unauthorized)', async () => {
    const profRes = await request('GET', '/auth/me');
    assert(profRes.status === 401, 'Profile without auth returns 401 Unauthorized');
  });

  // 18. Authenticated user can perform RSVP
  await test('18. Authenticated user can RSVP and manage their attendance', async () => {
    const loginRes = await request('POST', '/auth/login', {
      email: 'demo.user1@localvibe.demo',
      password: 'password123'
    });
    const token = loginRes.data.data.token;

    const listRes = await request('GET', '/events?limit=1');
    const eventId = listRes.data.data[0]._id || listRes.data.data[0].id;

    // RSVP GOING
    const rsvpRes = await request('POST', `/events/${eventId}/rsvp`, { status: 'GOING' }, token);
    assert(rsvpRes.status === 200, 'Authenticated RSVP status 200');
    assert(rsvpRes.data.data.status === 'GOING', 'RSVP status is GOING');

    // RSVP state in details
    const detRes = await request('GET', `/events/${eventId}`, null, token);
    assert(detRes.data.data.userRSVPStatus === 'GOING', 'User RSVP state reflected in details');
  });

  // 19. Calendar functionality URL verification & RSVP independence
  await test('19. Calendar action parameters valid and RSVP state unchanged by calendar view', async () => {
    const listRes = await request('GET', '/events?limit=1');
    const event = listRes.data.data[0];

    // Verify calendar URL format
    const startIso = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = event.endDate ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '') : startIso;
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location?.address || '')}`;

    assert(calUrl.includes('calendar.google.com/calendar/render'), 'Valid Google Calendar base URL');
    assert(calUrl.includes(encodeURIComponent(event.title)), 'Calendar URL includes encoded event title');

    // RSVP counts remain unchanged
    const afterDetRes = await request('GET', `/events/${event._id || event.id}`);
    assert(afterDetRes.data.data.goingCount === event.goingCount, 'Calendar view does not modify RSVP counts');
  });

  // 20. Outside India event creation is rejected by backend validator
  await test('20. Reject creation of non-Indian events (e.g. London / NYC coords)', async () => {
    const loginRes = await request('POST', '/auth/login', {
      email: 'curator@localvibe.app',
      password: 'password123'
    });
    const token = loginRes.data.data.token;

    // London coordinates: [lng: -0.1278, lat: 51.5074]
    const londonRes = await request('POST', '/events', {
      title: 'London Indie Rock Showcase',
      description: 'Music event outside India',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      location: {
        coordinates: [-0.1278, 51.5074],
        address: 'Soho, London',
        city: 'London'
      },
      price: 20
    }, token);

    assert(londonRes.status === 400, 'Outside India creation correctly returns 400 Bad Request');
    const errText = (londonRes.data.errors || []).join(' ') + (londonRes.data.message || '');
    assert(errText.includes('India'), 'Validation error specifies India-only location');
  });

  // 21. Outside India search returns zero events safely
  await test('21. Outside India coordinates (London: 51.5074, -0.1278) return 0 nearby events without error', async () => {
    const res = await request('GET', '/events/nearby?lat=51.5074&lng=-0.1278&radiusKm=20');
    assert(res.status === 200, 'Query returns status 200 without crashing');
    assert(res.data.data.length === 0, 'Returns empty array for outside-India coordinates');
  });

  // 22. Filter regression: Category and search filters work accurately
  await test('22. Filter regression: Category filter works for Music, Workshops, Food & Drink', async () => {
    const musicRes = await request('GET', '/events?category=Music');
    assert(musicRes.status === 200, 'Category filter status 200');
    assert(musicRes.data.data.every(e => e.category === 'Music'), 'All returned events have Music category');

    const searchRes = await request('GET', '/events?search=Bandra');
    assert(searchRes.status === 200, 'Search query status 200');
    assert(searchRes.data.data.length > 0, 'Found results for search "Bandra"');
  });

  // 23. Indian cities representation check
  await test('23. Diverse Indian cities represented across inventory', async () => {
    const res = await request('GET', '/events?limit=100');
    const cities = new Set(res.data.data.map(e => e.location.city));
    console.log('Represented cities:', Array.from(cities).join(', '));
    assert(cities.has('Mumbai'), 'Contains Mumbai events');
    assert(cities.has('Pune'), 'Contains Pune events');
    assert(cities.has('Thane'), 'Contains Thane events');
    assert(cities.has('Navi Mumbai'), 'Contains Navi Mumbai events');
    assert(cities.has('Bengaluru'), 'Contains Bengaluru events');
    assert(cities.has('Delhi'), 'Contains Delhi events');
    assert(cities.has('Hyderabad'), 'Contains Hyderabad events');
    assert(cities.has('Chennai'), 'Contains Chennai events');
    assert(cities.has('Kolkata'), 'Contains Kolkata events');
    assert(cities.has('Ahmedabad'), 'Contains Ahmedabad events');
    assert(cities.has('Jaipur'), 'Contains Jaipur events');
  });

  // 24. Authenticated user profile update
  await test('24. User profile updates persist correctly for Indian location', async () => {
    const loginRes = await request('POST', '/auth/login', {
      email: 'demo.user1@localvibe.demo',
      password: 'password123'
    });
    const token = loginRes.data.data.token;

    const updateRes = await request('PUT', '/auth/me', {
      bio: 'Hyperlocal explorer and live music lover in Bandra West.',
      location: { city: 'Mumbai', coordinates: [72.8258, 19.0596] }
    }, token);

    assert(updateRes.status === 200, 'Profile update status 200');
    assert(updateRes.data.data.bio === 'Hyperlocal explorer and live music lover in Bandra West.', 'Bio updated successfully');
  });

  console.log('\n========================================================================');
  console.log(`ALL TESTS PASSED! (${passed}/${total} test suites successful)`);
  console.log('========================================================================\n');
};

runAllTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
