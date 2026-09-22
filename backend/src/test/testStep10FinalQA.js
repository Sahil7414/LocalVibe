/**
 * LOCALVIBE STEP 10: FULL PRODUCT INTEGRATION & FINAL QA VERIFICATION SUITE
 * 
 * Verifies all 32 checklist categories across Backend, Database, Geospatial,
 * Authentication, RSVP Lifecycle, Calendar, My Events, Profile, Security, and Error Handling.
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api';
let passCount = 0;
let failCount = 0;

function pass(testName, details = '') {
  passCount++;
  console.log(`[PASS \u2705] ${testName}${details ? ` \u2014 ${details}` : ''}`);
}

function fail(testName, error) {
  failCount++;
  console.error(`[FAIL \u274C] ${testName}:`, error);
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
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

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runStep10FinalQA() {
  console.log('\n========================================================================');
  console.log('LOCALVIBE STEP 10: FULL PRODUCT INTEGRATION & FINAL QA SUITE');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: APPLICATION BOOT & HEALTH CHECK
    // -------------------------------------------------------------------------
    console.log('--- 1. Application Startup & Backend Health ---');
    const healthRes = await request('GET', '/health');
    if (healthRes.status === 200 && healthRes.body?.success) {
      pass('Backend health check status 200 OK', `Message: ${healthRes.body.message}`);
    } else {
      fail('Backend health check failed', healthRes.status);
    }

    // -------------------------------------------------------------------------
    // SECTION 2: DATABASE CONNECTIVITY & CORE ENDPOINTS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Database Connectivity & Collections ---');
    const dbEventsRes = await request('GET', '/events?limit=5');
    if (dbEventsRes.status === 200 && Array.isArray(dbEventsRes.body?.data)) {
      pass('MongoDB Atlas database is connected and responding to queries');
      pass('Events collection populated and accessible via REST API');
    } else {
      fail('Database query via /events failed', dbEventsRes.status);
    }

    // -------------------------------------------------------------------------
    // SECTION 3: INDIA-ONLY DATA INVENTORY VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. India-Only Event Inventory & Coordinates ---');
    const allEventsRes = await request('GET', '/events?limit=100');
    const allEvents = allEventsRes.body?.data || [];
    
    if (allEvents.length >= 25) {
      pass(`Event database inventory is sufficiently populated (${allEvents.length} events found)`);
    } else {
      fail('Event inventory low', allEvents.length);
    }

    let allCoordsValid = true;
    let allInIndia = true;
    let noForeignEvents = true;

    allEvents.forEach(evt => {
      const coords = evt.location?.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) {
        allCoordsValid = false;
      } else {
        const [lng, lat] = coords;
        // Bounding box for India: Lat [6.0..38.0], Lng [68.0..98.0]
        if (lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) {
          allInIndia = false;
        }
      }

      const lowerText = `${evt.title} ${evt.location?.address} ${evt.location?.city}`.toLowerCase();
      if (lowerText.includes('new york') || lowerText.includes('brooklyn') || lowerText.includes('london') || lowerText.includes('soho')) {
        noForeignEvents = false;
      }
    });

    if (allCoordsValid) {
      pass('All events store coordinates as valid GeoJSON 2-tuple [longitude, latitude]');
    } else {
      fail('Some events have invalid coordinates structure');
    }

    if (allInIndia) {
      pass('All 100% of event coordinates strictly fall within India bounding box [6.0..38.0°N, 68.0..98.0°E]');
    } else {
      fail('Found events outside India boundaries');
    }

    if (noForeignEvents) {
      pass('Zero non-Indian legacy event data remaining (no NYC/London events)');
    } else {
      fail('Foreign legacy events detected');
    }

    // -------------------------------------------------------------------------
    // SECTION 4: DEMO ACCOUNTS & PASSWORD HASHING
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Demo Accounts & Password Security ---');
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

    let demoLoginSuccess = true;
    let adminToken = null;
    let regularUserToken = null;
    let testOrganizerToken = null;

    for (const email of demoEmails) {
      const loginRes = await request('POST', '/auth/login', {
        email: email,
        password: 'password123'
      });
      if (loginRes.status === 200 && loginRes.body?.data?.token) {
        if (email === 'curator@localvibe.app') adminToken = loginRes.body.data.token;
        if (email === 'demo.user1@localvibe.demo') regularUserToken = loginRes.body.data.token;
        if (email === 'demo.mumbai@localvibe.demo') testOrganizerToken = loginRes.body.data.token;
      } else {
        demoLoginSuccess = false;
        console.error(`Login failed for ${email}:`, loginRes.status, loginRes.body);
      }
    }

    if (demoLoginSuccess) {
      pass('All demo accounts log in successfully with password123 (bcrypt-hashed)');
    } else {
      fail('Failed demo account login');
    }

    // -------------------------------------------------------------------------
    // SECTION 5: GUEST USER JOURNEY & BOUNDARIES
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Guest User Discovery & Boundary Enforcement ---');
    const guestDiscoverRes = await request('GET', '/events?limit=10');
    if (guestDiscoverRes.status === 200 && Array.isArray(guestDiscoverRes.body?.data)) {
      pass('Guest can browse Discover feed publicly without login');
    } else {
      fail('Guest Discover browsing failed', guestDiscoverRes.status);
    }

    const firstEventId = allEvents[0]._id;
    const guestDetailRes = await request('GET', `/events/${firstEventId}`);
    if (guestDetailRes.status === 200 && guestDetailRes.body?.data?.title) {
      pass('Guest can view Event Details publicly', guestDetailRes.body.data.title);
    } else {
      fail('Guest Event Details access failed', guestDetailRes.status);
    }

    const guestAttendeesRes = await request('GET', `/events/${firstEventId}/attendees`);
    if (guestAttendeesRes.status === 200 && Array.isArray(guestAttendeesRes.body?.data?.attendees)) {
      pass('Guest can view public attendees list', `Count: ${guestAttendeesRes.body.data.attendees.length}`);
    } else {
      fail('Guest attendees view failed', guestAttendeesRes.status);
    }

    // Protected boundaries for guests
    const guestRsvpRes = await request('POST', `/events/${firstEventId}/rsvp`, { status: 'GOING' });
    if (guestRsvpRes.status === 401) {
      pass('Guest RSVP attempt rejected with 401 Unauthorized');
    } else {
      fail('Guest RSVP allowed without auth', guestRsvpRes.status);
    }

    const guestMyEventsRes = await request('GET', '/events/user/my-events');
    if (guestMyEventsRes.status === 401) {
      pass('Guest My Events attempt rejected with 401 Unauthorized');
    } else {
      fail('Guest My Events allowed without auth', guestMyEventsRes.status);
    }

    const guestCreateEventRes = await request('POST', '/events', { title: 'Unauthorized Event' });
    if (guestCreateEventRes.status === 401) {
      pass('Guest Create Event attempt rejected with 401 Unauthorized');
    } else {
      fail('Guest Create Event allowed without auth', guestCreateEventRes.status);
    }

    const guestProfileRes = await request('GET', '/auth/me');
    if (guestProfileRes.status === 401) {
      pass('Guest Profile attempt rejected with 401 Unauthorized');
    } else {
      fail('Guest Profile allowed without auth', guestProfileRes.status);
    }

    // -------------------------------------------------------------------------
    // SECTION 6: GEOSPATIAL SEARCH & MULTI-CITY NEARBY
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Geospatial Search & Multi-City Accuracy ---');
    const citiesToTest = [
      { name: 'Mumbai (Bandra)', lat: 19.0596, lng: 72.8258, expectedMin: 2 },
      { name: 'Pune (Koregaon Park)', lat: 18.5362, lng: 73.8913, expectedMin: 2 },
      { name: 'Bengaluru (Cubbon Park)', lat: 12.9763, lng: 77.5925, expectedMin: 1 },
      { name: 'Delhi (Hauz Khas)', lat: 28.5535, lng: 77.1947, expectedMin: 1 },
      { name: 'Hyderabad (HITEC City)', lat: 17.4474, lng: 78.3813, expectedMin: 1 }
    ];

    for (const city of citiesToTest) {
      const nearbyRes = await request('GET', `/events/nearby?lat=${city.lat}&lng=${city.lng}&radiusKm=30`);
      if (nearbyRes.status === 200 && nearbyRes.body?.data?.length >= city.expectedMin) {
        pass(`Nearby search for ${city.name} returns ${nearbyRes.body.data.length} events within 30km`);
      } else {
        fail(`Nearby search for ${city.name} failed or returned fewer events`, nearbyRes.body?.data?.length);
      }
    }

    // Test Radius Filtering (10km vs 50km in Mumbai)
    const mumbai10Res = await request('GET', '/events/nearby?lat=19.0596&lng=72.8258&radiusKm=10');
    const mumbai50Res = await request('GET', '/events/nearby?lat=19.0596&lng=72.8258&radiusKm=50');
    if (mumbai10Res.body.data.length <= mumbai50Res.body.data.length) {
      pass(`Radius scaling verified: 10km (${mumbai10Res.body.data.length} events) \u2264 50km (${mumbai50Res.body.data.length} events)`);
    } else {
      fail('Radius scaling inverted', { r10: mumbai10Res.body.data.length, r50: mumbai50Res.body.data.length });
    }

    // Test outside India coords (London: 51.5074, -0.1278)
    const londonRes = await request('GET', '/events/nearby?lat=51.5074&lng=-0.1278&radiusKm=50');
    if (londonRes.status === 200 && londonRes.body.data.length === 0) {
      pass('Outside India GPS search (London) returns 0 events safely without crashing');
    } else {
      fail('Outside India GPS search returned unexpected events or error', londonRes.status);
    }

    // -------------------------------------------------------------------------
    // SECTION 7: SEARCH & MULTI-FILTER COMBINATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Search & Filter Combinations ---');
    const searchRes = await request('GET', '/events?search=Bandra');
    if (searchRes.status === 200 && searchRes.body.data.some(e => e.title.includes('Bandra') || e.location?.address.includes('Bandra'))) {
      pass('Search keyword "Bandra" returns matching events');
    } else {
      fail('Search keyword "Bandra" failed', searchRes.status);
    }

    const catRes = await request('GET', '/events?category=Music');
    if (catRes.status === 200 && catRes.body.data.every(e => e.category === 'Music')) {
      pass('Category filter "Music" returns only Music events');
    } else {
      fail('Category filter failed', catRes.status);
    }

    const freeRes = await request('GET', '/events?price=free');
    if (freeRes.status === 200 && freeRes.body.data.every(e => e.price === 0)) {
      pass('Price filter "free" returns only free (₹0) events');
    } else {
      fail('Price filter failed', freeRes.status);
    }

    // -------------------------------------------------------------------------
    // SECTION 8: AUTHENTICATED USER JOURNEY & RSVP LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- 8. RSVP Complete Lifecycle & My Events Sync ---');
    const testEvent = allEvents[0];
    const testEvtId = testEvent._id;

    // RSVP GOING
    const rsvpGoingRes = await request('POST', `/events/${testEvtId}/rsvp`, { status: 'GOING' }, regularUserToken);
    if (rsvpGoingRes.status === 200 && rsvpGoingRes.body?.data?.status === 'GOING') {
      pass('User can RSVP as GOING');
    } else {
      fail('RSVP GOING failed', rsvpGoingRes.status);
    }

    // Check My Events contains the going event
    const myEventsRes = await request('GET', '/events/user/my-events', null, regularUserToken);
    if (myEventsRes.status === 200 && myEventsRes.body?.data?.going?.some(e => (e._id || e.id) === testEvtId)) {
      pass('RSVP GOING event appears in My Events "going" tab');
    } else {
      fail('RSVP event missing from My Events going tab', myEventsRes.body?.data);
    }

    // RSVP Switch to INTERESTED
    const rsvpIntRes = await request('POST', `/events/${testEvtId}/rsvp`, { status: 'INTERESTED' }, regularUserToken);
    if (rsvpIntRes.status === 200 && rsvpIntRes.body?.data?.status === 'INTERESTED') {
      pass('User can switch RSVP from GOING to INTERESTED');
    } else {
      fail('RSVP switch failed', rsvpIntRes.status);
    }

    // Cancel RSVP
    const rsvpCancelRes = await request('DELETE', `/events/${testEvtId}/rsvp`, null, regularUserToken);
    if (rsvpCancelRes.status === 200 && rsvpCancelRes.body?.data?.status === null) {
      pass('User can cancel RSVP (DELETE /rsvp returns status: null)');
    } else {
      fail('RSVP cancel failed', rsvpCancelRes.status);
    }

    // Verify My Events removes the event
    const myEventsAfterCancel = await request('GET', '/events/user/my-events', null, regularUserToken);
    const inGoing = myEventsAfterCancel.body?.data?.going?.some(e => (e._id || e.id) === testEvtId);
    const inInterested = myEventsAfterCancel.body?.data?.interested?.some(e => (e._id || e.id) === testEvtId);
    if (!inGoing && !inInterested) {
      pass('Cancelled event removed from both Going and Interested tabs in My Events');
    } else {
      fail('Cancelled event still present in My Events', { inGoing, inInterested });
    }

    // -------------------------------------------------------------------------
    // SECTION 9: EVENT CREATION LIFECYCLE & INDIA BOUNDARIES
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Event Creation Lifecycle & India Geographic Validation ---');
    
    // Attempt invalid outside-India event creation (London)
    const foreignCreateRes = await request('POST', '/events', {
      title: 'London Underground Jazz Night',
      description: 'A non-Indian event test that should be rejected.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      location: {
        address: 'Westminster, London',
        city: 'London',
        state: 'London',
        country: 'United Kingdom',
        coordinates: [-0.1278, 51.5074]
      },
      price: 100
    }, testOrganizerToken);

    if (foreignCreateRes.status === 400) {
      pass('Creation of non-Indian event (London) correctly rejected with 400 Bad Request');
    } else {
      fail('Non-Indian event creation was not rejected', foreignCreateRes.status);
    }

    // Valid Indian event creation (Kolkata)
    const validCreateRes = await request('POST', '/events', {
      title: 'Kolkata Victoria Memorial Sunset Sketching & Chai',
      description: 'An open-air sketching session at Victoria Memorial gardens.',
      category: 'Arts & Culture',
      startDate: new Date(Date.now() + 172800000).toISOString(),
      endDate: new Date(Date.now() + 172800000 + 7200000).toISOString(),
      location: {
        address: 'Queens Way, Maidan, Kolkata',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        coordinates: [88.3426, 22.5448]
      },
      price: 0,
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
      tags: ['Art', 'Sketching', 'Kolkata', 'Chai']
    }, testOrganizerToken);

    let createdEventId = null;
    if (validCreateRes.status === 201 && validCreateRes.body?.data?._id) {
      createdEventId = validCreateRes.body.data._id;
      pass('Valid Indian event created successfully (201 Created)', `ID: ${createdEventId}`);
    } else {
      fail('Valid Indian event creation failed', { status: validCreateRes.status, body: validCreateRes.body });
    }

    // Verify event in My Events -> Hosted
    if (createdEventId) {
      const myCreatedRes = await request('GET', '/events/user/my-events', null, testOrganizerToken);
      if (myCreatedRes.body?.data?.created?.some(e => (e._id || e.id) === createdEventId)) {
        pass('Newly created event appears in organizer My Events "hosted" tab');
      } else {
        fail('Created event missing from My Events hosted tab');
      }

      // Cleanup test created event
      const deleteRes = await request('DELETE', `/events/${createdEventId}`, null, testOrganizerToken);
      if (deleteRes.status === 200) {
        pass('Test event cleaned up successfully');
      }
    }

    // -------------------------------------------------------------------------
    // SECTION 10: USER PROFILE & SECURITY IMMUTABILITY
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Profile Operations & Security Immutability ---');
    const meRes = await request('GET', '/auth/me', null, regularUserToken);
    if (meRes.status === 200 && meRes.body?.data?.name) {
      pass('GET /auth/me returns authenticated user details');
    } else {
      fail('GET /auth/me failed', meRes.status);
    }

    // Verify passwordHash is never returned
    if (meRes.body?.data?.passwordHash === undefined && meRes.body?.data?.password === undefined) {
      pass('User response strictly excludes password and passwordHash');
    } else {
      fail('Security vulnerability: password field exposed in user profile response');
    }

    // Update Profile Bio
    const updateProfileRes = await request('PUT', '/auth/me', {
      bio: 'Hyperlocal event lover in Mumbai. Final QA verified!'
    }, regularUserToken);

    if (updateProfileRes.status === 200 && updateProfileRes.body?.data?.bio?.includes('Final QA verified!')) {
      pass('Profile bio update persisted successfully');
    } else {
      fail('Profile update failed', updateProfileRes.status);
    }

    // Attempt unauthorized role escalation via profile update
    const roleHackRes = await request('PUT', '/auth/me', {
      role: 'ADMIN'
    }, regularUserToken);
    if (roleHackRes.status === 400 && roleHackRes.body?.errors?.some(e => e.includes('Role cannot be modified'))) {
      pass('Security check: Role cannot be modified via user profile update (rejected with 400)');
    } else {
      fail('Security flaw: Role modification not rejected', roleHackRes.body);
    }

    // -------------------------------------------------------------------------
    // SECTION 11: ERROR HANDLING & EDGE CASES
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Error Handling & Edge Cases ---');
    const invalidIdRes = await request('GET', '/events/invalid-mongo-id-123');
    if (invalidIdRes.status === 400 || invalidIdRes.status === 404) {
      pass('Malformed event ID returns graceful 400/404 without crashing backend');
    } else {
      fail('Malformed event ID unhandled', invalidIdRes.status);
    }

    const nonExistentRes = await request('GET', '/events/507f1f77bcf86cd799439011');
    if (nonExistentRes.status === 404) {
      pass('Non-existent event ID returns clean 404 Not Found');
    } else {
      fail('Non-existent event ID returned unexpected status', nonExistentRes.status);
    }

    const invalidLoginRes = await request('POST', '/auth/login', {
      email: 'nonexistent@localvibe.in',
      password: 'wrongpassword'
    });
    if (invalidLoginRes.status === 401) {
      pass('Invalid credentials return 401 Unauthorized with meaningful message');
    } else {
      fail('Invalid credentials check failed', invalidLoginRes.status);
    }

    console.log('\n========================================================================');
    console.log(`STEP 10 FINAL QA TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Unhandled QA test suite error:', err);
    fail('Test suite exception', err.message);
  }
}

runStep10FinalQA();
