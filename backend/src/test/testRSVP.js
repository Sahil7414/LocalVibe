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
  console.log('STARTING LOCALVIBE PHASE 7: RSVP VERIFICATION TEST');
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
    // 1. Start In-Memory MongoDB Server & Mongoose Connection
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Setup] In-Memory MongoDB running at ${uri}`);

    // Verify RSVP compound unique index definition
    const rsvpIndexes = await RSVP.schema.indexes();
    const hasUniqueCompoundIndex = rsvpIndexes.some(
      idx => idx[0].user === 1 && idx[0].event === 1 && idx[1]?.unique === true
    );
    assert(hasUniqueCompoundIndex, 'RSVP model has compound unique index { user: 1, event: 1 }');

    // 2. Boot Express test server
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
    console.log(`[Setup] Express server listening on port ${port}\n`);

    // 3. Create Seed Users
    const organizer = await User.create({
      name: 'Curator Host',
      email: 'curator@localvibe.app',
      passwordHash: 'hashed_password_123',
      role: 'ORGANIZER'
    });

    const explorerUser = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      passwordHash: 'hashed_password_123',
      role: 'USER'
    });

    const explorerUser2 = await User.create({
      name: 'Pooja Patil',
      email: 'pooja@example.com',
      passwordHash: 'hashed_password_123',
      role: 'USER'
    });

    const user1Token = generateToken({ id: explorerUser._id.toString(), role: explorerUser.role });
    const user2Token = generateToken({ id: explorerUser2._id.toString(), role: explorerUser2.role });

    // 4. Create Seed Events
    const activeEvent1 = await Event.create({
      title: 'Bandra Sunset Acoustic Jam',
      description: 'Live seaside music at Bandra Bandstand.',
      category: 'Music',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      location: {
        type: 'Point',
        coordinates: [72.8258, 19.0431],
        address: 'Bandra Bandstand, Mumbai',
        city: 'Mumbai'
      },
      price: 0,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      organizer: organizer._id,
      status: 'ACTIVE'
    });

    const activeEvent2 = await Event.create({
      title: 'Koregaon Park Pottery Session',
      description: 'Handmade pottery workshop.',
      category: 'Workshops',
      startDate: new Date(Date.now() + 172800000),
      endDate: new Date(Date.now() + 180000000),
      location: {
        type: 'Point',
        coordinates: [73.8913, 18.5362],
        address: 'Koregaon Park, Pune',
        city: 'Pune'
      },
      price: 500,
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261',
      organizer: explorerUser._id, // Created by explorerUser
      status: 'ACTIVE'
    });

    const cancelledEvent = await Event.create({
      title: 'Cancelled Monsoon Trek',
      description: 'Trek cancelled due to heavy rain.',
      category: 'Sports',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      location: {
        type: 'Point',
        coordinates: [72.8258, 19.0431],
        address: 'Lonavala Hills',
        city: 'Lonavala'
      },
      price: 200,
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
      organizer: organizer._id,
      status: 'CANCELLED'
    });

    // TEST 1: POST /api/events/:id/rsvp -> GOING
    console.log('\n--- TEST 1: Set RSVP to GOING ---');
    const rsvpGoingRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    const rsvpGoingData = await rsvpGoingRes.json();
    assert(rsvpGoingRes.status === 200, 'POST RSVP returns 200 OK');
    assert(rsvpGoingData.data.status === 'GOING', 'RSVP state confirmed as GOING');
    assert(rsvpGoingData.data.goingCount === 1, 'Event goingCount is 1');
    assert(rsvpGoingData.data.interestedCount === 0, 'Event interestedCount is 0');
    assert(rsvpGoingData.data.attendeesCount === 1, 'Event attendeesCount is 1');

    // TEST 2: GET /api/events/:id -> Verify enriched RSVP status
    console.log('\n--- TEST 2: Event Details with user status ---');
    const eventDetailsRes = await fetch(`${baseUrl}/events/${activeEvent1._id}`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const eventDetailsData = await eventDetailsRes.json();
    assert(eventDetailsData.data.userRSVPStatus === 'GOING', 'GET /events/:id returns userRSVPStatus "GOING"');
    assert(eventDetailsData.data.goingCount === 1, 'GET /events/:id returns goingCount = 1');

    // TEST 3: Switch RSVP from GOING to INTERESTED
    console.log('\n--- TEST 3: Switch RSVP from GOING to INTERESTED ---');
    const rsvpSwitchRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    const rsvpSwitchData = await rsvpSwitchRes.json();
    assert(rsvpSwitchRes.status === 200, 'POST RSVP switch returns 200 OK');
    assert(rsvpSwitchData.data.status === 'INTERESTED', 'RSVP status switched to INTERESTED');
    assert(rsvpSwitchData.data.goingCount === 0, 'goingCount adjusted to 0');
    assert(rsvpSwitchData.data.interestedCount === 1, 'interestedCount adjusted to 1');
    assert(rsvpSwitchData.data.attendeesCount === 1, 'attendeesCount remains 1');

    // TEST 4: Database Uniqueness Verification
    console.log('\n--- TEST 4: Database Uniqueness Constraint Verification ---');
    const rsvpDocCount = await RSVP.countDocuments({
      user: explorerUser._id,
      event: activeEvent1._id
    });
    assert(rsvpDocCount === 1, 'Exactly ONE RSVP document exists for this user/event pair in MongoDB');

    // TEST 5: Second user RSVPs GOING
    console.log('\n--- TEST 5: Multiple users RSVP for same event ---');
    const user2RsvpRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user2Token}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    const user2RsvpData = await user2RsvpRes.json();
    assert(user2RsvpData.data.goingCount === 1, 'goingCount is 1 (User 2)');
    assert(user2RsvpData.data.interestedCount === 1, 'interestedCount is 1 (User 1)');
    assert(user2RsvpData.data.attendeesCount === 2, 'attendeesCount is 2');

    // TEST 6: User 1 Cancels RSVP
    console.log('\n--- TEST 6: DELETE /api/events/:id/rsvp (Cancel RSVP) ---');
    const cancelRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200, 'DELETE RSVP returns 200 OK');
    assert(cancelData.data.status === null, 'RSVP status is null after cancellation');
    assert(cancelData.data.goingCount === 1, 'goingCount is 1 (User 2 remaining)');
    assert(cancelData.data.interestedCount === 0, 'interestedCount is 0 (User 1 removed)');
    assert(cancelData.data.attendeesCount === 1, 'attendeesCount is 1');

    const user1RsvpDoc = await RSVP.findOne({ user: explorerUser._id, event: activeEvent1._id });
    assert(user1RsvpDoc === null, 'User 1 RSVP document successfully deleted from database');

    // TEST 7: Unauthenticated RSVP Rejection
    console.log('\n--- TEST 7: Unauthenticated Request Rejection ---');
    const unauthRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(unauthRes.status === 401, 'Unauthenticated RSVP rejected with 401 Unauthorized');

    // TEST 8: Invalid RSVP Status Rejection
    console.log('\n--- TEST 8: Invalid Status Rejection ---');
    const invalidStatusRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({ status: 'MAYBE' })
    });
    assert(invalidStatusRes.status === 400, 'Invalid status "MAYBE" rejected with 400 Bad Request');

    // TEST 9: Nonexistent Event Rejection
    console.log('\n--- TEST 9: Nonexistent Event Rejection ---');
    const nonexistentRes = await fetch(`${baseUrl}/events/670000000000000000000999/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(nonexistentRes.status === 404, 'Nonexistent event RSVP rejected with 404 Not Found');

    // TEST 10: Cancelled Event RSVP Rejection
    console.log('\n--- TEST 10: Cancelled Event RSVP Rejection ---');
    const cancelledRes = await fetch(`${baseUrl}/events/${cancelledEvent._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(cancelledRes.status === 400, 'RSVP to cancelled event rejected with 400 Bad Request');

    // TEST 11: Concurrent / Rapid Requests
    console.log('\n--- TEST 11: Rapid Concurrent Requests (Race Condition & Unique Constraint Test) ---');
    const concurrentStatuses = ['GOING', 'INTERESTED', 'GOING', 'INTERESTED', 'GOING'];
    await Promise.all(
      concurrentStatuses.map(status =>
        fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user1Token}`
          },
          body: JSON.stringify({ status })
        })
      )
    );
    const finalUser1Count = await RSVP.countDocuments({ user: explorerUser._id, event: activeEvent1._id });
    assert(finalUser1Count === 1, 'Concurrency test: Exactly ONE record exists despite rapid concurrent requests');

    // TEST 12: My Events Endpoint (Categorized lists)
    console.log('\n--- TEST 12: My Events Hub (GET /api/events/user/my-events) ---');
    // Set user1 to GOING for activeEvent1
    await fetch(`${baseUrl}/events/${activeEvent1._id}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });

    const myEventsRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const myEventsData = await myEventsRes.json();
    assert(myEventsRes.status === 200, 'GET /events/user/my-events returns 200 OK');
    assert(Array.isArray(myEventsData.data.going), 'my-events contains "going" array');
    assert(myEventsData.data.going.length === 1, 'my-events going count is 1');
    assert(myEventsData.data.going[0]._id.toString() === activeEvent1._id.toString(), 'going event matches activeEvent1');
    assert(myEventsData.data.created.length === 1, 'my-events created count is 1 (activeEvent2 created by user)');
    assert(myEventsData.data.created[0]._id.toString() === activeEvent2._id.toString(), 'created event matches activeEvent2');

    // TEST 13: Public Attendees Endpoint
    console.log('\n--- TEST 13: Public Attendees Endpoint (GET /api/events/:id/attendees) ---');
    const attendeesRes = await fetch(`${baseUrl}/events/${activeEvent1._id}/attendees`);
    const attendeesData = await attendeesRes.json();
    assert(attendeesRes.status === 200, 'GET /events/:id/attendees returns 200 OK');
    assert(attendeesData.data.attendees.length === 2, 'Attendees list contains 2 users (User 1 and User 2)');
    assert(attendeesData.data.goingCount === 2, 'attendees goingCount is 2');

    console.log('\n==================================================');
    console.log(`ALL ${passed}/${total} PHASE 7 RSVP TESTS PASSED CLEANLY!`);
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
