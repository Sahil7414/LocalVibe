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
  console.log('STARTING LOCALVIBE PHASE 8: MY EVENTS TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [Test ${total}] PASSED: ${description}`);
    } else {
      console.error(`❌ [Test ${total}] FAILED: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    // 1. Setup in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Setup] In-Memory MongoDB running at ${uri}`);

    // 2. Start Express server
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
    console.log(`[Setup] Express test server running on port ${port}\n`);

    // 3. Create test users
    const userA = await User.create({
      name: 'Aarav Mehta',
      email: 'aarav@example.com',
      passwordHash: 'hashed_password_123',
      role: 'USER'
    });

    const userB = await User.create({
      name: 'Priya Sen',
      email: 'priya@example.com',
      passwordHash: 'hashed_password_123',
      role: 'ORGANIZER'
    });

    const tokenA = generateToken({ id: userA._id.toString(), role: userA.role });
    const tokenB = generateToken({ id: userB._id.toString(), role: userB.role });

    // 4. Create initial events
    const event1 = await Event.create({
      title: 'Kala Ghoda Art & Music Walk',
      description: 'Explore heritage architecture and indie art galleries.',
      category: 'Arts & Culture',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      location: {
        type: 'Point',
        coordinates: [72.8313, 18.9288],
        address: 'Kala Ghoda, Fort, Mumbai',
        city: 'Mumbai'
      },
      price: 0,
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
      organizer: userB._id,
      status: 'ACTIVE'
    });

    const event2 = await Event.create({
      title: 'Bandra Rooftop Jazz Soiree',
      description: 'Intimate evening jazz concert on the terrace.',
      category: 'Music',
      startDate: new Date(Date.now() + 172800000),
      endDate: new Date(Date.now() + 180000000),
      location: {
        type: 'Point',
        coordinates: [72.8258, 19.0596],
        address: 'Pali Hill, Bandra West, Mumbai',
        city: 'Mumbai'
      },
      price: 450,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      organizer: userB._id,
      status: 'ACTIVE'
    });

    // TEST 1: New Authenticated User with No Events (Empty States verification)
    console.log('\n--- TEST 1: Empty Hub for Fresh User ---');
    const emptyHubRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const emptyHubData = await emptyHubRes.json();
    assert(emptyHubRes.status === 200, 'GET /api/events/user/my-events returns 200 OK');
    assert(emptyHubData.success === true, 'Response indicates success');
    assert(Array.isArray(emptyHubData.data.going) && emptyHubData.data.going.length === 0, 'Going events list is empty');
    assert(Array.isArray(emptyHubData.data.interested) && emptyHubData.data.interested.length === 0, 'Interested events list is empty');
    assert(Array.isArray(emptyHubData.data.created) && emptyHubData.data.created.length === 0, 'Created events list is empty');
    assert(emptyHubData.data.counts.going === 0, 'Going count is 0');
    assert(emptyHubData.data.counts.interested === 0, 'Interested count is 0');
    assert(emptyHubData.data.counts.created === 0, 'Created count is 0');

    // TEST 2: Alias Endpoint GET /api/users/me/events
    console.log('\n--- TEST 2: Alias Endpoint /api/users/me/events ---');
    const aliasHubRes = await fetch(`${baseUrl}/users/me/events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const aliasHubData = await aliasHubRes.json();
    assert(aliasHubRes.status === 200, 'GET /api/users/me/events returns 200 OK');
    assert(aliasHubData.data.counts.going === 0, 'Alias endpoint returns consistent data');

    // TEST 3: User A RSVPs GOING to Event 1
    console.log('\n--- TEST 3: User A Marks Event 1 as GOING ---');
    const rsvpGoingRes = await fetch(`${baseUrl}/events/${event1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(rsvpGoingRes.status === 200, 'RSVP GOING status set successfully');

    const hubAfterGoingRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const hubAfterGoingData = await hubAfterGoingRes.json();
    assert(hubAfterGoingData.data.going.length === 1, 'Going list has 1 event');
    assert(hubAfterGoingData.data.going[0]._id.toString() === event1._id.toString(), 'Going event matches Event 1');
    assert(hubAfterGoingData.data.going[0].userRSVPStatus === 'GOING', 'Event object includes userRSVPStatus "GOING"');
    assert(hubAfterGoingData.data.interested.length === 0, 'Interested list remains empty');
    assert(hubAfterGoingData.data.counts.going === 1, 'Counts.going is 1');

    // TEST 4: User A Marks Event 2 as INTERESTED
    console.log('\n--- TEST 4: User A Marks Event 2 as INTERESTED ---');
    const rsvpInterestedRes = await fetch(`${baseUrl}/events/${event2._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(rsvpInterestedRes.status === 200, 'RSVP INTERESTED status set successfully');

    const hubAfterInterestedRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const hubAfterInterestedData = await hubAfterInterestedRes.json();
    assert(hubAfterInterestedData.data.going.length === 1, 'Going list has 1 event');
    assert(hubAfterInterestedData.data.interested.length === 1, 'Interested list has 1 event');
    assert(hubAfterInterestedData.data.interested[0]._id.toString() === event2._id.toString(), 'Interested event matches Event 2');
    assert(hubAfterInterestedData.data.interested[0].userRSVPStatus === 'INTERESTED', 'Event object includes userRSVPStatus "INTERESTED"');
    assert(hubAfterInterestedData.data.counts.going === 1, 'Counts.going is 1');
    assert(hubAfterInterestedData.data.counts.interested === 1, 'Counts.interested is 1');

    // TEST 5: Switching RSVP from GOING to INTERESTED (Event 1)
    console.log('\n--- TEST 5: Switch Event 1 from GOING to INTERESTED ---');
    const switchRes = await fetch(`${baseUrl}/events/${event1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(switchRes.status === 200, 'Switch RSVP returns 200 OK');

    const hubAfterSwitchRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const hubAfterSwitchData = await hubAfterSwitchRes.json();
    assert(hubAfterSwitchData.data.going.length === 0, 'Going list is now empty');
    assert(hubAfterSwitchData.data.interested.length === 2, 'Interested list now contains 2 events');
    assert(hubAfterSwitchData.data.counts.going === 0, 'Counts.going updated to 0');
    assert(hubAfterSwitchData.data.counts.interested === 2, 'Counts.interested updated to 2');

    // TEST 6: Cancelling RSVP (Remove Event 1 from My Events)
    console.log('\n--- TEST 6: Cancel RSVP on Event 1 ---');
    const cancelRes = await fetch(`${baseUrl}/events/${event1._id}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(cancelRes.status === 200, 'DELETE RSVP returns 200 OK');

    const hubAfterCancelRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const hubAfterCancelData = await hubAfterCancelRes.json();
    assert(hubAfterCancelData.data.going.length === 0, 'Going list is 0');
    assert(hubAfterCancelData.data.interested.length === 1, 'Interested list has only Event 2');
    assert(hubAfterCancelData.data.interested[0]._id.toString() === event2._id.toString(), 'Event 2 remains in Interested');

    // TEST 7: Created Events (Organizer Isolation)
    console.log('\n--- TEST 7: Created Events for User B (Organizer) ---');
    const hubUserBRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const hubUserBData = await hubUserBRes.json();
    assert(hubUserBRes.status === 200, 'User B can fetch their own My Events');
    assert(hubUserBData.data.created.length === 2, 'User B has 2 created events');
    assert(hubUserBData.data.counts.created === 2, 'Counts.created for User B is 2');
    assert(hubUserBData.data.going.length === 0, 'User B has 0 going events');

    // TEST 8: User A Creates a New Event
    console.log('\n--- TEST 8: User A Creates an Event and Verifies in Created Section ---');
    const newEventPayload = {
      title: 'Dharavi Pottery Guild Exhibition',
      description: 'Live clay crafting and terracotta design workshop.',
      category: 'Workshops',
      startDate: new Date(Date.now() + 259200000).toISOString(),
      endDate: new Date(Date.now() + 266400000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [72.8550, 19.0430],
        address: '90 Feet Road, Dharavi, Mumbai',
        city: 'Mumbai'
      },
      price: 150,
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261'
    };

    const createRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify(newEventPayload)
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Event creation returns 201 Created');
    const createdEventId = createData.data._id;

    const hubUserAAfterCreateRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const hubUserAAfterCreateData = await hubUserAAfterCreateRes.json();
    assert(hubUserAAfterCreateData.data.created.length === 1, 'User A now has 1 created event');
    assert(hubUserAAfterCreateData.data.created[0]._id.toString() === createdEventId.toString(), 'Created event matches newly published ID');
    assert(hubUserAAfterCreateData.data.counts.created === 1, 'Counts.created is 1');

    // TEST 9: Unauthenticated Protection (Security Verification)
    console.log('\n--- TEST 9: Security Verification on My Events Route ---');
    const unauthRes = await fetch(`${baseUrl}/events/user/my-events`);
    assert(unauthRes.status === 401, 'Unauthenticated request to /events/user/my-events returns 401 Unauthorized');

    const unauthAliasRes = await fetch(`${baseUrl}/users/me/events`);
    assert(unauthAliasRes.status === 401, 'Unauthenticated request to /users/me/events returns 401 Unauthorized');

    // TEST 10: User Privacy & Isolation (User A cannot see User B's events in their RSVP list)
    console.log('\n--- TEST 10: User Isolation & Privacy ---');
    assert(
      !hubUserAAfterCreateData.data.created.some(ev => ev._id.toString() === event1._id.toString()),
      'User A does not see User B created events in their created list'
    );
    assert(
      !hubUserBData.data.created.some(ev => ev._id.toString() === createdEventId.toString()),
      'User B does not see User A created events in their created list'
    );

    console.log('\n==================================================');
    console.log(`ALL ${passed}/${total} PHASE 8 MY EVENTS TESTS PASSED!`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
};

runTests();
