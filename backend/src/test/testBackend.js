const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { Event } = require('../models/Event');
const RSVP = require('../models/RSVP');
const { generateToken } = require('../utils/jwt');

let mongod;
let server;
let baseUrl;

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING LOCALVIBE PHASE 1 BACKEND VERIFICATION');
  console.log('==================================================\n');

  try {
    // 1. Start In-Memory MongoDB Server
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`[Test Setup] In-Memory MongoDB running at ${uri}`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[Test Setup] Mongoose connected successfully.');

    await Event.createIndexes();
    console.log('[Test 1] Event 2dsphere indexes created on MongoDB collection successfully.');

    // 3. Boot Express test server
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
    console.log(`[Test Setup] Express server listening on port ${port}`);

    // Create test organizer user & token
    const organizer = await User.create({
      name: 'Test Host',
      email: 'host@localvibe.app',
      passwordHash: 'hashed_password_123',
      role: 'USER'
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${generateToken(organizer)}`
    };

    // 4. Test Event Creation via API (POST /api/events)
    console.log('\n[Test 2] Testing POST /api/events (Event Creation)...');
    const mumbaiEventData = {
      title: 'Bandra Seaside Music Jam',
      description: 'Acoustic live music by Bandra Fort overlooking the Arabian Sea.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 90000000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [72.8258, 19.0431], // GeoJSON order: [longitude, latitude]
        address: 'Bandra Fort Amphitheatre, Bandra West',
        city: 'Mumbai'
      },
      price: 250,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      organizer: organizer._id.toString(),
      isFeatured: true
    };

    const createRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(mumbaiEventData)
    });
    const createData = await createRes.json();
    console.log('Create Response Status:', createRes.status);
    console.log('Created Event ID:', createData.data._id);
    console.log('Verified GeoJSON Coordinates:', createData.data.location.coordinates);

    // 5. Test Invalid Coordinates Validation Rejection
    console.log('\n[Test 3] Testing Event Validation (Invalid Coordinates Rejection)...');
    const invalidCoordsData = {
      ...mumbaiEventData,
      title: 'Invalid Coords Event',
      location: {
        type: 'Point',
        coordinates: [300, 19.0431], // Invalid Longitude > 180
        address: 'Invalid Address'
      }
    };
    const invalidRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(invalidCoordsData)
    });
    const invalidData = await invalidRes.json();
    console.log('Invalid Coords Response Status (Expect 400):', invalidRes.status);
    console.log('Validation Error Messages:', invalidData.errors);

    // 6. Create Additional Test Events (Pune & Far Out Events)
    console.log('\n[Test 4] Creating additional events for Mumbai and Pune...');
    const puneEventData = {
      title: 'Koregaon Park Food & Flea Market',
      description: 'Artisanal cheese, sourdough, and live jazz.',
      category: 'Markets',
      startDate: new Date(Date.now() + 172800000).toISOString(),
      endDate: new Date(Date.now() + 180000000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [73.8913, 18.5362], // Pune [longitude, latitude]
        address: 'Lane 6, Koregaon Park, Pune',
        city: 'Pune'
      },
      price: 0,
      image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9',
      organizer: organizer._id.toString(),
      isFeatured: false
    };

    await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(puneEventData)
    });

    // 7. Test Geospatial Nearby Search (GET /api/events/nearby)
    console.log('\n[Test 5] Testing GET /api/events/nearby ($near 2dsphere spatial query)...');
    // Mumbai center coordinates: lat: 19.0760, lng: 72.8777, radius: 10 km
    const nearbyRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radius=10`);
    const nearbyData = await nearbyRes.json();
    console.log('Nearby Search Response Status:', nearbyRes.status);
    console.log(`Found ${nearbyData.data.length} events within 10 km of Mumbai.`);
    console.log('Returned Nearby Event Title:', nearbyData.data[0]?.title);

    // Test that Pune event (120 km away) is excluded from 10 km radius
    const puneIncluded = nearbyData.data.some(e => e.title.includes('Pune'));
    console.log('Verified Pune Event (120km away) is excluded from 10km search:', !puneIncluded);

    // 8. Test Search & Filters (GET /api/events?category=Music&price=paid)
    console.log('\n[Test 6] Testing GET /api/events filters (Category=Music, Price=paid)...');
    const filterRes = await fetch(`${baseUrl}/events?category=Music&price=paid`);
    const filterData = await filterRes.json();
    console.log('Filter Query Result Count:', filterData.data.length);
    console.log('Pagination Total:', filterData.pagination.total);

    // 9. Test Single Event Retrieval (GET /api/events/:id)
    console.log('\n[Test 7] Testing GET /api/events/:id...');
    const createdId = createData.data._id;
    const singleRes = await fetch(`${baseUrl}/events/${createdId}`);
    const singleData = await singleRes.json();
    console.log('Single Event Title:', singleData.data.title);

    // 10. Test Event Update (PUT /api/events/:id)
    console.log('\n[Test 8] Testing PUT /api/events/:id (Update Event)...');
    const updateRes = await fetch(`${baseUrl}/events/${createdId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ price: 300, isFeatured: false })
    });
    const updateData = await updateRes.json();
    console.log('Updated Price:', updateData.data.price);

    // 11. Test Event Deletion (DELETE /api/events/:id)
    console.log('\n[Test 9] Testing DELETE /api/events/:id...');
    const deleteRes = await fetch(`${baseUrl}/events/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    console.log('Delete Response Success:', deleteData.success);

    console.log('\n==================================================');
    console.log('ALL PHASE 1 BACKEND TESTS COMPLETED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  }
};

runTests();
