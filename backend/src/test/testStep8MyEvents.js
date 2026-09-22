const baseUrl = 'http://localhost:5000/api';

const runStep8MyEventsTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 8: MY EVENTS FUNCTIONAL AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, message) => {
    total++;
    if (condition) {
      console.log(`[PASS ✅] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL ❌] Test ${total}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  };

  try {
    // -----------------------------------------------------------------
    // SECTION 1: ACCESS CONTROL & UNAUTHENTICATED PROTECTION
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Access Control & Route Protection ---');
    const unauthRes = await fetch(`${baseUrl}/events/user/my-events`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/events/user/my-events returns 401 Unauthorized');
    const unauthData = await unauthRes.json();
    assert(unauthData.success === false, 'Unauthenticated response reports success: false');

    // -----------------------------------------------------------------
    // SECTION 2: USER SETUP & EMPTY INITIAL STATE
    // -----------------------------------------------------------------
    console.log('\n--- 2. Setting Up Authenticated Users & Empty Initial State ---');
    const timestamp = Date.now();
    const userAEmail = `user_myevents_a_${timestamp}@localvibe.app`;
    const regResA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kabir Verma',
        email: userAEmail,
        password: 'password123',
        role: 'ORGANIZER'
      })
    });
    assert(regResA.status === 201, 'User A (Organizer) registration returns 201 Created');
    const userAData = await regResA.json();
    const tokenA = userAData.data.token;
    const userAId = userAData.data.user.id || userAData.data.user._id;

    // Register User B (Attendee)
    const userBEmail = `user_myevents_b_${timestamp}@localvibe.app`;
    const regResB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tara Rao',
        email: userBEmail,
        password: 'password123',
        role: 'USER'
      })
    });
    assert(regResB.status === 201, 'User B registration returns 201 Created');
    const userBData = await regResB.json();
    const tokenB = userBData.data.token;

    // Verify empty state for brand-new User A
    const emptyResA = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(emptyResA.status === 200, 'Authenticated GET /api/events/user/my-events returns 200 OK');
    const emptyDataA = await emptyResA.json();
    assert(emptyDataA.success === true, 'Response payload reports success: true');
    assert(Array.isArray(emptyDataA.data.going) && emptyDataA.data.going.length === 0, 'Initial "going" list is empty array');
    assert(Array.isArray(emptyDataA.data.interested) && emptyDataA.data.interested.length === 0, 'Initial "interested" list is empty array');
    assert(Array.isArray(emptyDataA.data.created) && emptyDataA.data.created.length === 0, 'Initial "created" list is empty array');
    assert(emptyDataA.data.counts.going === 0, 'counts.going === 0');
    assert(emptyDataA.data.counts.interested === 0, 'counts.interested === 0');
    assert(emptyDataA.data.counts.created === 0, 'counts.created === 0');

    // -----------------------------------------------------------------
    // SECTION 3: RSVP SYNCHRONIZATION (GOING & INTERESTED)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing RSVP Synchronization in My Events ---');
    const eventsRes = await fetch(`${baseUrl}/events?limit=10`);
    const eventsData = await eventsRes.json();
    const event1 = eventsData.data[0];
    const event2 = eventsData.data[1];
    const eventId1 = event1._id || event1.id;
    const eventId2 = event2._id || event2.id;

    // User A RSVPs GOING to Event 1
    const rsvp1Res = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(rsvp1Res.status === 200, 'User A RSVPs GOING to Event 1');

    // User A RSVPs INTERESTED to Event 2
    const rsvp2Res = await fetch(`${baseUrl}/events/${eventId2}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(rsvp2Res.status === 200, 'User A RSVPs INTERESTED to Event 2');

    // Retrieve My Events for User A
    const myEvents1Res = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const myEvents1Data = await myEvents1Res.json();
    assert(myEvents1Data.data.going.length === 1, 'My Events "going" list contains exactly 1 event');
    assert(myEvents1Data.data.interested.length === 1, 'My Events "interested" list contains exactly 1 event');
    assert(myEvents1Data.data.counts.going === 1, 'counts.going === 1');
    assert(myEvents1Data.data.counts.interested === 1, 'counts.interested === 1');

    const goingEvent = myEvents1Data.data.going[0];
    assert((goingEvent._id || goingEvent.id) === eventId1, 'Going event ID matches Event 1 ID');
    assert(goingEvent.userRSVPStatus === 'GOING', 'Going event userRSVPStatus is "GOING"');
    assert(typeof goingEvent.title === 'string' && goingEvent.title.length > 0, `Going event title: "${goingEvent.title}"`);
    assert(goingEvent.location && typeof goingEvent.location === 'object', 'Going event has populated location object');
    assert(typeof goingEvent.goingCount === 'number' && goingEvent.goingCount >= 1, 'Going event has accurate goingCount');

    const interestedEvent = myEvents1Data.data.interested[0];
    assert((interestedEvent._id || interestedEvent.id) === eventId2, 'Interested event ID matches Event 2 ID');
    assert(interestedEvent.userRSVPStatus === 'INTERESTED', 'Interested event userRSVPStatus is "INTERESTED"');

    // -----------------------------------------------------------------
    // SECTION 4: CREATED / HOSTED EVENTS TAB
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Created / Hosted Events in My Events ---');
    // User A creates Event 3
    const createRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Bandra Acoustic Songwriter Circle',
        description: 'An intimate evening of original songs, storytelling, and acoustic harmonies.',
        category: 'Music',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 97200000).toISOString(),
        price: 150,
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        location: {
          address: 'Pali Naka, Bandra West, Mumbai',
          city: 'Mumbai',
          coordinates: [72.8295, 19.0596] // [longitude, latitude]
        }
      })
    });
    assert(createRes.status === 201, 'User A creates new event via POST /api/events (201 Created)');
    const createData = await createRes.json();
    const createdEventId = createData.data._id || createData.data.id;

    // Check My Events for User A
    const myEvents2Res = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const myEvents2Data = await myEvents2Res.json();
    assert(myEvents2Data.data.created.length === 1, 'My Events "created" list contains 1 event');
    assert(myEvents2Data.data.counts.created === 1, 'counts.created === 1');
    const createdEvent = myEvents2Data.data.created[0];
    assert((createdEvent._id || createdEvent.id) === createdEventId, 'Created event ID matches new event ID');
    assert(createdEvent.title === 'Bandra Acoustic Songwriter Circle', 'Created event title is accurate');
    assert(createdEvent.category === 'Music', 'Created event category is "Music"');
    assert(createdEvent.price === 150, 'Created event price is ₹150');

    // -----------------------------------------------------------------
    // SECTION 5: STRICT USER ISOLATION
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Strict Multi-User Isolation ---');
    // User B views My Events: User B has 0 RSVPs and 0 created events
    const myEventsBRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(myEventsBRes.status === 200, 'User B GET /api/events/user/my-events returns 200 OK');
    const myEventsBData = await myEventsBRes.json();
    assert(myEventsBData.data.going.length === 0, 'User B sees 0 going events (User A events not leaked)');
    assert(myEventsBData.data.interested.length === 0, 'User B sees 0 interested events');
    assert(myEventsBData.data.created.length === 0, 'User B sees 0 created events (User A hosted event not leaked)');
    assert(myEventsBData.data.counts.going === 0, 'User B counts.going === 0');
    assert(myEventsBData.data.counts.created === 0, 'User B counts.created === 0');

    // -----------------------------------------------------------------
    // SECTION 6: RSVP STATUS SWITCHING SYNCHRONIZATION
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Tab Re-organization upon Status Switch ---');
    // User A switches Event 1 from GOING to INTERESTED
    const switchRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(switchRes.status === 200, 'User A switches Event 1 to INTERESTED');

    const myEventsSwitchRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const myEventsSwitchData = await myEventsSwitchRes.json();
    assert(myEventsSwitchData.data.going.length === 0, 'Going list is now empty (0 events)');
    assert(myEventsSwitchData.data.interested.length === 2, 'Interested list now contains 2 events (Event 1 + Event 2)');
    assert(myEventsSwitchData.data.counts.going === 0, 'counts.going is 0');
    assert(myEventsSwitchData.data.counts.interested === 2, 'counts.interested is 2');

    // -----------------------------------------------------------------
    // SECTION 7: RSVP CANCELLATION SYNCHRONIZATION
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Event Removal upon RSVP Cancellation ---');
    // User A cancels RSVP for Event 1
    const cancelRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(cancelRes.status === 200, 'User A cancels RSVP for Event 1');

    const myEventsCancelRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const myEventsCancelData = await myEventsCancelRes.json();
    assert(myEventsCancelData.data.interested.length === 1, 'Interested list decrements to 1 event (Event 1 removed)');
    assert(!myEventsCancelData.data.interested.some(e => (e._id || e.id) === eventId1), 'Event 1 is completely absent from My Events');
    assert(myEventsCancelData.data.counts.interested === 1, 'counts.interested is 1');

    // -----------------------------------------------------------------
    // SECTION 8: EVENT MUTATION & DELETION SYNCHRONIZATION
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testing Created Event Edit & Deletion Synchronization ---');
    // User A updates Event 3 title
    const updateRes = await fetch(`${baseUrl}/events/${createdEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Bandra Acoustic Songwriter Circle (Updated)'
      })
    });
    assert(updateRes.status === 200, 'User A updates Event 3 (200 OK)');

    const myEventsUpdateRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const myEventsUpdateData = await myEventsUpdateRes.json();
    const updatedCreatedEvent = myEventsUpdateData.data.created.find(e => (e._id || e.id) === createdEventId);
    assert(updatedCreatedEvent.title === 'Bandra Acoustic Songwriter Circle (Updated)', 'My Events reflects updated event title');

    // User A deletes Event 3
    const deleteRes = await fetch(`${baseUrl}/events/${createdEventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(deleteRes.status === 200, 'User A deletes Event 3 (200 OK)');

    const myEventsDeleteRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const myEventsDeleteData = await myEventsDeleteRes.json();
    assert(myEventsDeleteData.data.created.length === 0, 'Created list is now 0 after event deletion');
    assert(myEventsDeleteData.data.counts.created === 0, 'counts.created is 0');

    // -----------------------------------------------------------------
    // SECTION 9: SECURITY & SENSITIVE DATA EXCLUSION
    // -----------------------------------------------------------------
    console.log('\n--- 9. Testing Security & Sensitive Data Exclusion ---');
    for (const ev of myEventsDeleteData.data.interested) {
      assert(ev.organizer !== undefined, 'Event has populated organizer');
      if (typeof ev.organizer === 'object') {
        assert(ev.organizer.passwordHash === undefined, 'organizer.passwordHash is strictly undefined');
        assert(ev.organizer.password === undefined, 'organizer.password is strictly undefined');
      }
    }

    console.log('\n====================================================');
    console.log(`STEP 8 MY EVENTS AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Step 8 Audit Failed:', error);
    process.exit(1);
  }
};

runStep8MyEventsTests();
