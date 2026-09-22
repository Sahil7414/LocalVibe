const baseUrl = 'http://localhost:5000/api';

const runStep7RSVPAttendeeTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 7: RSVP LIFECYCLE & ATTENDEE AUDIT');
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
    // SETUP: RETRIEVE TEST EVENTS & REGISTER TEST USERS
    // -----------------------------------------------------------------
    console.log('--- 1. Setting Up Test Users & Events ---');
    const eventsRes = await fetch(`${baseUrl}/events?limit=10`);
    assert(eventsRes.status === 200, 'GET /api/events returns 200 OK');
    const eventsData = await eventsRes.json();
    assert(Array.isArray(eventsData.data) && eventsData.data.length >= 3, 'Found at least 3 active events for multi-event testing');

    const event1 = eventsData.data[0];
    const event2 = eventsData.data[1];
    const event3 = eventsData.data[2];
    const eventId1 = event1._id || event1.id;
    const eventId2 = event2._id || event2.id;
    const eventId3 = event3._id || event3.id;

    // Register User A
    const timestamp = Date.now();
    const userAEmail = `userA_${timestamp}@localvibe.app`;
    const regResA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Mehta',
        email: userAEmail,
        password: 'password123'
      })
    });
    assert(regResA.status === 201, 'User A registration returns 201 Created');
    const userAData = await regResA.json();
    const tokenA = userAData.data.token;
    assert(typeof tokenA === 'string' && tokenA.length > 20, 'User A receives valid JWT token');

    // Register User B
    const userBEmail = `userB_${timestamp}@localvibe.app`;
    const regResB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Diya Sen',
        email: userBEmail,
        password: 'password123'
      })
    });
    assert(regResB.status === 201, 'User B registration returns 201 Created');
    const userBData = await regResB.json();
    const tokenB = userBData.data.token;
    assert(typeof tokenB === 'string' && tokenB.length > 20, 'User B receives valid JWT token');

    // -----------------------------------------------------------------
    // SECTION 2: UNAUTHENTICATED USER GUARDRAILS
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Unauthenticated RSVP Guardrails ---');
    const unauthPostRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(unauthPostRes.status === 401, 'Unauthenticated POST /api/events/:id/rsvp returns 401 Unauthorized');

    const unauthDelRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'DELETE'
    });
    assert(unauthDelRes.status === 401, 'Unauthenticated DELETE /api/events/:id/rsvp returns 401 Unauthorized');

    // -----------------------------------------------------------------
    // SECTION 3: AUTHENTICATED USER A — MARK GOING
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Authenticated User — Mark GOING ---');
    // Baseline state before RSVP
    const baselineRes = await fetch(`${baseUrl}/events/${eventId1}`);
    const baselineData = await baselineRes.json();
    const initialGoing = baselineData.data.goingCount || 0;
    const initialInterested = baselineData.data.interestedCount || 0;

    const rsvpGoingRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(rsvpGoingRes.status === 200, 'User A POST /rsvp (GOING) returns 200 OK');
    const rsvpGoingData = await rsvpGoingRes.json();
    assert(rsvpGoingData.success === true, 'Response payload reports success: true');
    assert(rsvpGoingData.data.status === 'GOING', 'Response data status is "GOING"');
    assert(rsvpGoingData.data.goingCount === initialGoing + 1, `goingCount incremented by 1 (${initialGoing} -> ${rsvpGoingData.data.goingCount})`);
    assert(rsvpGoingData.data.interestedCount === initialInterested, 'interestedCount remains unchanged');
    assert(rsvpGoingData.data.attendeesCount === rsvpGoingData.data.goingCount + rsvpGoingData.data.interestedCount, 'attendeesCount === goingCount + interestedCount');

    // Verify Event Details reflection for User A
    const detailResA = await fetch(`${baseUrl}/events/${eventId1}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const detailDataA = await detailResA.json();
    assert(detailDataA.data.userRSVPStatus === 'GOING', 'Event Details correctly reflects User A userRSVPStatus === "GOING"');
    assert(detailDataA.data.goingCount === initialGoing + 1, 'Event Details goingCount matches incremented count');

    // -----------------------------------------------------------------
    // SECTION 4: SWITCHING RSVP STATUS (GOING -> INTERESTED)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Status Switching (GOING -> INTERESTED) ---');
    const rsvpSwitchRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(rsvpSwitchRes.status === 200, 'User A switch to INTERESTED returns 200 OK');
    const rsvpSwitchData = await rsvpSwitchRes.json();
    assert(rsvpSwitchData.data.status === 'INTERESTED', 'Response data status switched to "INTERESTED"');
    assert(rsvpSwitchData.data.goingCount === initialGoing, `goingCount reverted back to baseline (${initialGoing})`);
    assert(rsvpSwitchData.data.interestedCount === initialInterested + 1, `interestedCount incremented by 1 (${initialInterested} -> ${initialInterested + 1})`);

    // Verify Event Details reflection for User A after switch
    const detailSwitchRes = await fetch(`${baseUrl}/events/${eventId1}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const detailSwitchData = await detailSwitchRes.json();
    assert(detailSwitchData.data.userRSVPStatus === 'INTERESTED', 'Event Details correctly reflects User A userRSVPStatus === "INTERESTED"');

    // Switch back: INTERESTED -> GOING
    const rsvpBackRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(rsvpBackRes.status === 200, 'User A switch back to GOING returns 200 OK');
    const rsvpBackData = await rsvpBackRes.json();
    assert(rsvpBackData.data.status === 'GOING', 'Status switched back to "GOING"');
    assert(rsvpBackData.data.goingCount === initialGoing + 1, 'goingCount incremented again');

    // -----------------------------------------------------------------
    // SECTION 5: DUPLICATE RSVP PROTECTION (IDEMPOTENCE)
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Duplicate Submission Protection ---');
    // Send identical GOING request multiple times rapidly
    const dupRes1 = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    const dupRes2 = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(dupRes1.status === 200 && dupRes2.status === 200, 'Repeated submissions return 200 OK safely');
    const dupData2 = await dupRes2.json();
    assert(dupData2.data.goingCount === initialGoing + 1, 'Repeated submissions do NOT inflate goingCount');

    // -----------------------------------------------------------------
    // SECTION 6: MULTI-USER ISOLATION & USER B RSVP
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Multi-User Consistency & Isolation ---');
    // User B views event 1: should see User A's goingCount (initial + 1), but userRSVPStatus: null
    const detailB1 = await fetch(`${baseUrl}/events/${eventId1}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const detailB1Data = await detailB1.json();
    assert(detailB1Data.data.userRSVPStatus === null, 'User B initially has userRSVPStatus === null');
    assert(detailB1Data.data.goingCount === initialGoing + 1, 'User B sees aggregate goingCount from User A');

    // User B marks INTERESTED
    const rsvpBRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(rsvpBRes.status === 200, 'User B marks INTERESTED returns 200 OK');
    const rsvpBData = await rsvpBRes.json();
    assert(rsvpBData.data.goingCount === initialGoing + 1, 'goingCount remains initial + 1');
    assert(rsvpBData.data.interestedCount === initialInterested + 1, 'interestedCount becomes initial + 1');
    assert(rsvpBData.data.attendeesCount === initialGoing + 1 + initialInterested + 1, 'attendeesCount reflects sum of both users');

    // User A views event 1 again: should still see userRSVPStatus === 'GOING'
    const detailA2 = await fetch(`${baseUrl}/events/${eventId1}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const detailA2Data = await detailA2.json();
    assert(detailA2Data.data.userRSVPStatus === 'GOING', 'User A preserves userRSVPStatus === "GOING" without leakage from User B');

    // -----------------------------------------------------------------
    // SECTION 7: ATTENDEE LIST & SENSITIVE DATA SECURITY
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Public Attendees Endpoint & Security ---');
    const attendeesRes = await fetch(`${baseUrl}/events/${eventId1}/attendees`);
    assert(attendeesRes.status === 200, 'GET /api/events/:id/attendees returns 200 OK');
    const attendeesData = await attendeesRes.json();
    assert(attendeesData.success === true, 'Attendees endpoint reports success: true');
    assert(Array.isArray(attendeesData.data.attendees), 'Attendees data contains attendees array');
    
    // User A is GOING, so User A should be in the attendees array
    const foundUserA = attendeesData.data.attendees.find(a => a.name === 'Aarav Mehta');
    assert(foundUserA !== undefined, 'User A ("Aarav Mehta") is present in GOING attendees list');
    
    // STRICT SECURITY: passwordHash and sensitive fields must NEVER be returned
    for (const attendee of attendeesData.data.attendees) {
      assert(attendee.passwordHash === undefined, `Attendee "${attendee.name}" passwordHash is undefined`);
      assert(attendee.password === undefined, `Attendee "${attendee.name}" password is undefined`);
      assert(typeof attendee.name === 'string' && attendee.name.length > 0, `Attendee has valid public name: "${attendee.name}"`);
    }

    // -----------------------------------------------------------------
    // SECTION 8: MULTIPLE EVENTS INDEPENDENCE
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testing RSVP Isolation across Multiple Events ---');
    // User A marks Event 2 as INTERESTED
    const rsvpEvent2 = await fetch(`${baseUrl}/events/${eventId2}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'INTERESTED' })
    });
    assert(rsvpEvent2.status === 200, 'User A RSVPs to Event 2 as INTERESTED');

    // User A does not RSVP to Event 3
    const ev1A = await (await fetch(`${baseUrl}/events/${eventId1}`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    const ev2A = await (await fetch(`${baseUrl}/events/${eventId2}`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    const ev3A = await (await fetch(`${baseUrl}/events/${eventId3}`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();

    assert(ev1A.data.userRSVPStatus === 'GOING', 'Event 1 status for User A is "GOING"');
    assert(ev2A.data.userRSVPStatus === 'INTERESTED', 'Event 2 status for User A is "INTERESTED"');
    assert(ev3A.data.userRSVPStatus === null, 'Event 3 status for User A is null (no RSVP)');

    // Check User's My Events categorization
    const myEventsRes = await fetch(`${baseUrl}/events/user/my-events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(myEventsRes.status === 200, 'GET /api/events/user/my-events returns 200 OK');
    const myEventsData = await myEventsRes.json();
    assert(myEventsData.data.going.some(e => (e._id || e.id) === eventId1), 'Event 1 is in User A "going" list');
    assert(myEventsData.data.interested.some(e => (e._id || e.id) === eventId2), 'Event 2 is in User A "interested" list');
    assert(!myEventsData.data.going.some(e => (e._id || e.id) === eventId3), 'Event 3 is NOT in User A "going" list');

    // -----------------------------------------------------------------
    // SECTION 9: RSVP CANCELLATION (DELETE /events/:id/rsvp)
    // -----------------------------------------------------------------
    console.log('\n--- 9. Testing RSVP Cancellation ---');
    // User A cancels Event 1 (was GOING)
    const cancelEv1Res = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(cancelEv1Res.status === 200, 'DELETE /events/:id/rsvp returns 200 OK');
    const cancelEv1Data = await cancelEv1Res.json();
    assert(cancelEv1Data.data.status === null, 'Response status is null after cancellation');
    assert(cancelEv1Data.data.goingCount === initialGoing, `goingCount decremented back to initial (${initialGoing})`);

    // Verify Event 1 Details after cancellation
    const postCancelA1 = await (await fetch(`${baseUrl}/events/${eventId1}`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    assert(postCancelA1.data.userRSVPStatus === null, 'User A userRSVPStatus is null after cancellation');

    // User A cancels Event 2 (was INTERESTED)
    const cancelEv2Res = await fetch(`${baseUrl}/events/${eventId2}/rsvp`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(cancelEv2Res.status === 200, 'DELETE /events/:id/rsvp for INTERESTED event returns 200 OK');

    const postCancelA2 = await (await fetch(`${baseUrl}/events/${eventId2}`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    assert(postCancelA2.data.userRSVPStatus === null, 'User A userRSVPStatus for Event 2 is null after cancellation');

    // -----------------------------------------------------------------
    // SECTION 10: INPUT VALIDATION & ERROR HANDLING
    // -----------------------------------------------------------------
    console.log('\n--- 10. Testing Input Validation & Error Handling ---');
    // Invalid status (e.g. MAYBE)
    const invalidStatusRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'MAYBE' })
    });
    assert(invalidStatusRes.status === 400, 'POST /rsvp with invalid status "MAYBE" returns 400 Bad Request');
    const invalidStatusData = await invalidStatusRes.json();
    assert(invalidStatusData.success === false, 'Invalid status response reports success: false');

    // Missing status body
    const missingStatusRes = await fetch(`${baseUrl}/events/${eventId1}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({})
    });
    assert(missingStatusRes.status === 400, 'POST /rsvp with missing status returns 400 Bad Request');

    // Non-existent event ID
    const notFoundRes = await fetch(`${baseUrl}/events/670000000000000000000999/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(notFoundRes.status === 404, 'POST /rsvp for non-existent event ID returns 404 Not Found');

    console.log('\n====================================================');
    console.log(`STEP 7 RSVP AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Step 7 Audit Failed:', error);
    process.exit(1);
  }
};

runStep7RSVPAttendeeTests();
