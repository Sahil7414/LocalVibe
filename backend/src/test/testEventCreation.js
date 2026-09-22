const mongoose = require('mongoose');
const http = require('http');
const app = require('../app');
const { validateEventInput } = require('../validators/eventValidator');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const { Event } = require('../models/Event');

console.log('==================================================');
console.log('STARTING LOCALVIBE PHASE 6 EVENT CREATION TESTS');
console.log('==================================================\n');

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
      res.on('data', chunk => body += chunk);
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

const runPhase6Tests = async () => {
  let passed = 0;
  let total = 0;

  const assert = (condition, message) => {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS ✅] ${message}`);
    } else {
      console.error(`[FAIL ❌] ${message}`);
    }
  };

  try {
    await startServer();

    // 1. Unauthenticated event creation
    const unauthRes = await makeRequest(`${baseUrl}/events`, {
      method: 'POST',
      body: { title: 'Unauthorized Event' }
    });
    assert(unauthRes.status === 401, 'POST /api/events without Bearer token returns 401 Unauthorized');

    // 2. Unit Validation checks
    const invalidTitle = validateEventInput({
      title: '',
      description: 'Valid description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      location: { address: 'Test', coordinates: [72.82, 19.05] },
      price: 0
    });
    assert(!invalidTitle.isValid && invalidTitle.errors.some(e => e.includes('Title')), 'Validator rejects empty event title');

    const invalidCategory = validateEventInput({
      title: 'Valid Title',
      description: 'Valid description',
      category: 'InvalidCategory123',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      location: { address: 'Test', coordinates: [72.82, 19.05] },
      price: 0
    });
    assert(!invalidCategory.isValid && invalidCategory.errors.some(e => e.includes('Category')), 'Validator rejects non-existent category');

    const invalidEndBeforeStart = validateEventInput({
      title: 'Valid Title',
      description: 'Valid description',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now()).toISOString(),
      location: { address: 'Test', coordinates: [72.82, 19.05] },
      price: 0
    });
    assert(!invalidEndBeforeStart.isValid && invalidEndBeforeStart.errors.some(e => e.includes('prior')), 'Validator rejects end date prior to start date');

    const invalidCoordinates = validateEventInput({
      title: 'Valid Title',
      description: 'Valid description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      location: { address: 'Test', coordinates: [200, 45] }, // Longitude > 180
      price: 0
    });
    assert(!invalidCoordinates.isValid && invalidCoordinates.errors.some(e => e.includes('Longitude')), 'Validator rejects out-of-range longitude');

    const invalidPrice = validateEventInput({
      title: 'Valid Title',
      description: 'Valid description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      location: { address: 'Test', coordinates: [72.82, 19.05] },
      price: -50,
      image: 'https://example.com/cover.jpg'
    });
    assert(!invalidPrice.isValid && invalidPrice.errors.some(e => e.includes('Price')), 'Validator rejects negative price');

    const invalidImage = validateEventInput({
      title: 'Valid Title',
      description: 'Valid description',
      category: 'Music',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      location: { address: 'Test', coordinates: [72.82, 19.05] },
      price: 0,
      image: ''
    });
    assert(!invalidImage.isValid && invalidImage.errors.some(e => e.includes('Cover image')), 'Validator rejects missing or empty cover image');

    const validPayload = {
      title: 'Backyard Vinyl Listening Session & Chai Club',
      description: 'Analog soul, Japanese city pop & spiced chai in Bandra West courtyard.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 + 14400000).toISOString(),
      location: {
        address: 'The Corner Club, Pali Naka, Bandra West, Mumbai 400050',
        city: 'Mumbai',
        coordinates: [72.8295, 19.0596] // [longitude, latitude]
      },
      price: 399,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819'
    };
    const validCheck = validateEventInput(validPayload);
    assert(validCheck.isValid, 'Validator approves complete valid event payload');

    // 3. Authenticated Creation via JWT
    const mockOrganizerId = new mongoose.Types.ObjectId();
    const token = generateToken({
      id: mockOrganizerId.toString(),
      email: 'organizer@localvibe.app',
      role: 'ORGANIZER'
    });

    // Test token signing
    assert(typeof token === 'string' && token.length > 20, 'JWT token generated for organizer');

    console.log(`\n==================================================`);
    console.log(`PHASE 6 TESTS COMPLETED: ${passed}/${total} PASSED`);
    console.log(`==================================================`);
  } catch (err) {
    console.error('Test run failed:', err);
  } finally {
    await closeServer();
  }
};

runPhase6Tests();
