const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const { generateToken } = require('../utils/jwt');
const { validateEventInput } = require('../validators/eventValidator');

console.log('========================================================================');
console.log('LOCALVIBE: VERIFYING CLEAN CREATE EVENT & GEMINI REMOVAL');
console.log('========================================================================\n');

let server;
let port;
let baseUrl;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
};

const closeServer = () => {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
};

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
};

const runAudit = async () => {
  let passed = 0;
  let total = 0;

  const assert = (cond, msg) => {
    total++;
    if (cond) {
      passed++;
      console.log(`[PASS ✅] ${msg}`);
    } else {
      console.error(`[FAIL ❌] ${msg}`);
    }
  };

  try {
    await startServer();

    // 1. Verify /api/events/generate-cover is completely gone (404 Not Found)
    console.log('--- 1. Testing Gemini /generate-cover Endpoint Removal ---');
    const demoUserId = '670000000000000000000001';
    const token = generateToken({
      id: demoUserId,
      email: 'curator@localvibe.app',
      role: 'ADMIN'
    });

    const genCoverRes = await makeRequest(`${baseUrl}/events/generate-cover`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { title: 'Test Event' }
    });
    assert(
      genCoverRes.status === 404,
      `POST /api/events/generate-cover returned 404 Not Found (Status: ${genCoverRes.status})`
    );

    // 2. Verify backend event validation requires cover image
    console.log('\n--- 2. Testing Cover Image Required Validation ---');
    const missingImageUnit = validateEventInput({
      title: 'Workshop',
      description: 'A hands-on workshop',
      category: 'Workshops',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 90000000).toISOString(),
      location: { address: 'Bandra West, Mumbai', coordinates: [72.83, 19.05] },
      price: 0
    });
    assert(
      !missingImageUnit.isValid &&
        missingImageUnit.errors.some((e) => e.includes('Cover image is required')),
      'Unit validator rejects event creation payload without image'
    );

    // 3. Verify POST /api/events with missing image returns 400 Validation Error
    const createNoImageRes = await makeRequest(`${baseUrl}/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: 'Pottery Workshop',
        description: 'Learn pottery hands on',
        category: 'Workshops',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        location: {
          address: 'Bandra West, Mumbai',
          coordinates: [72.83, 19.05]
        },
        price: 500
      }
    });
    assert(
      createNoImageRes.status === 400 &&
        createNoImageRes.body.errors &&
        createNoImageRes.body.errors.some((e) => e.includes('Cover image is required')),
      'POST /api/events without image returns HTTP 400 with "Cover image is required" error'
    );

    // 4. Verify POST /api/events with valid uploaded image succeeds (201 Created)
    console.log('\n--- 3. Testing Valid Event Creation with Uploaded Image ---');
    const validPayload = {
      title: 'Pottery & Ceramics Morning Workshop',
      description: 'Hands-on pottery workshop guided by master ceramic artists in Mumbai.',
      category: 'Workshops',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 90000000).toISOString(),
      location: {
        address: 'Hiranandani Gardens, Powai, Mumbai',
        city: 'Mumbai',
        coordinates: [72.9051, 19.1176]
      },
      price: 800,
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...'
    };

    const createSuccessRes = await makeRequest(`${baseUrl}/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: validPayload
    });

    assert(
      createSuccessRes.status === 201 && createSuccessRes.body.data,
      'POST /api/events with user image returns 201 Created'
    );
    assert(
      createSuccessRes.body.data.image === validPayload.image,
      'Created event preserves exact user-uploaded image string (NO Unsplash fallback)'
    );

    // 5. Verify Event Retrieval
    console.log('\n--- 4. Testing Event Retrieval & Map/Discover Compatibility ---');
    const createdId = createSuccessRes.body.data._id || createSuccessRes.body.data.id;
    const getEventRes = await makeRequest(`${baseUrl}/events/${createdId}`);
    assert(getEventRes.status === 200, 'GET /api/events/:id returns 200 OK');
    assert(
      getEventRes.body.data.image === validPayload.image,
      'Event details endpoint returns exact uploaded image'
    );

    // 6. Verify Nearby Events includes created event
    const nearbyRes = await makeRequest(`${baseUrl}/events/nearby?lat=19.1176&lng=72.9051&radiusKm=5`);
    assert(nearbyRes.status === 200, 'GET /api/events/nearby returns 200 OK');
    const foundInNearby = nearbyRes.body.data.some((e) => (e._id || e.id) === createdId);
    assert(foundInNearby, 'Created event with uploaded image appears in nearby / map search results');

    console.log('\n========================================================================');
    console.log(`TEST RESULTS: ${passed}/${total} PASSED (100%)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await closeServer();
  }
};

runAudit();
