const http = require('http');

const API_PORT = process.env.PORT || 5000;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runDiagnosis() {
  console.log('==================================================');
  console.log('DIAGNOSING CREATED EVENT ON MAP BUG');
  console.log('==================================================');

  // 1. Login as demo organizer
  const loginRes = await makeRequest('POST', '/auth/login', {
    email: 'demo.mumbai@localvibe.demo',
    password: 'password123'
  });

  console.log('1. Login status:', loginRes.status);
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.error('Failed to get token:', loginRes);
    return;
  }

  // 2. Create a fresh test event in Bandra West, Mumbai
  // Bandra coordinates: [longitude: 72.8252, latitude: 19.0657]
  const createPayload = {
    title: 'Diag Event - Bandra Music Night ' + Date.now(),
    description: 'A test event created to verify map and discover visibility.',
    category: 'Music',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 3600000 * 3).toISOString(),
    location: {
      type: 'Point',
      coordinates: [72.8252, 19.0657], // [lng, lat]
      address: 'Carter Road Amphitheatre, Bandra West, Mumbai, Maharashtra 400050',
      city: 'Mumbai'
    },
    price: 0,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    capacity: 50,
    isFeatured: false,
    status: 'ACTIVE'
  };

  const createRes = await makeRequest('POST', '/events', createPayload, token);
  console.log('2. Create Event status:', createRes.status);
  console.log('Created Event Document:', JSON.stringify(createRes.data?.data || createRes.data, null, 2));

  const createdId = createRes.data?.data?._id || createRes.data?.data?.id;

  // 3. Query GET /api/events (all events)
  const allEventsRes = await makeRequest('GET', '/events?limit=100');
  const foundInAll = (allEventsRes.data?.data || []).find(e => (e._id || e.id) === createdId);
  console.log('3. Found in GET /api/events?', !!foundInAll);

  // 4. Query GET /api/events/nearby for Mumbai (Bandra coordinates: lat=19.0760, lng=72.8777, radius=15)
  const nearbyRes1 = await makeRequest('GET', `/events/nearby?lat=19.0760&lng=72.8777&radiusKm=15&limit=50`);
  const foundInNearby1 = (nearbyRes1.data?.data || []).find(e => (e._id || e.id) === createdId);
  console.log('4. Found in GET /api/events/nearby (Mumbai Bandra default center)?', !!foundInNearby1);
  if (foundInNearby1) {
    console.log('   Distance calculated:', foundInNearby1.distanceKm, 'km');
    console.log('   Coordinates in nearby response:', foundInNearby1.location?.coordinates);
  } else {
    console.log('   Nearby returned count:', (nearbyRes1.data?.data || []).length);
    console.log('   Nearby event titles:', (nearbyRes1.data?.data || []).map(e => ({ title: e.title, dist: e.distanceKm, coords: e.location?.coordinates })));
  }

  // 5. Query GET /api/events/nearby at the EXACT coordinates of the created event (lat=19.0657, lng=72.8252, radius=5)
  const nearbyRes2 = await makeRequest('GET', `/events/nearby?lat=19.0657&lng=72.8252&radiusKm=5&limit=50`);
  const foundInNearby2 = (nearbyRes2.data?.data || []).find(e => (e._id || e.id) === createdId);
  console.log('5. Found in GET /api/events/nearby (Exact event coords center)?', !!foundInNearby2);
  if (foundInNearby2) {
    console.log('   Distance calculated at exact coords:', foundInNearby2.distanceKm, 'km');
  }

  // 6. Check My Events
  const myEventsRes = await makeRequest('GET', '/events/user/my-events', null, token);
  const createdList = myEventsRes.data?.data?.created || [];
  const foundInCreated = createdList.find(e => (e._id || e.id) === createdId);
  console.log('6. Found in My Events (created/hosted gatherings)?', !!foundInCreated);

  console.log('==================================================');
}

runDiagnosis().catch(console.error);
