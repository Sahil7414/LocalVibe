const baseUrl = 'http://localhost:5000/api';

const runStep9GuestAuthProfileTests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 9: GUEST, AUTHENTICATED & PROFILE AUDIT');
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
    // SECTION 1: GUEST / NOT LOGGED-IN DISCOVERY EXPERIENCE
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Guest Discovery Experience (No Token) ---');
    
    // 1.1 Public Events List
    const publicEventsRes = await fetch(`${baseUrl}/events?limit=10`);
    assert(publicEventsRes.status === 200, 'Guest GET /api/events returns 200 OK without token');
    const publicEventsData = await publicEventsRes.json();
    assert(publicEventsData.success === true, 'Public events response reports success: true');
    assert(Array.isArray(publicEventsData.data) && publicEventsData.data.length > 0, 'Guest receives non-empty event list');
    
    const sampleEvent = publicEventsData.data[0];
    const sampleEventId = sampleEvent._id || sampleEvent.id;

    // 1.2 Public Search & Filtering
    const searchRes = await fetch(`${baseUrl}/events?search=Art`);
    assert(searchRes.status === 200, 'Guest GET /api/events?search=Art returns 200 OK');
    const searchData = await searchRes.json();
    assert(searchData.success === true, 'Search response reports success: true');

    const categoryRes = await fetch(`${baseUrl}/events?category=Music`);
    assert(categoryRes.status === 200, 'Guest GET /api/events?category=Music returns 200 OK');
    const categoryData = await categoryRes.json();
    assert(categoryData.success === true, 'Category filter returns success: true');
    assert(categoryData.data.every(e => e.category === 'Music'), 'All returned events belong to category Music');

    // 1.3 Public Geospatial Nearby Search
    const nearbyRes = await fetch(`${baseUrl}/events/nearby?lat=19.0760&lng=72.8777&radiusKm=15`);
    assert(nearbyRes.status === 200, 'Guest GET /api/events/nearby returns 200 OK');
    const nearbyData = await nearbyRes.json();
    assert(nearbyData.success === true, 'Nearby search reports success: true');
    assert(Array.isArray(nearbyData.data), 'Nearby events data is an array');

    // 1.4 Public Event Details
    const detailsRes = await fetch(`${baseUrl}/events/${sampleEventId}`);
    assert(detailsRes.status === 200, 'Guest GET /api/events/:id returns 200 OK');
    const detailsData = await detailsRes.json();
    assert(detailsData.success === true, 'Event details reports success: true');
    assert(detailsData.data.title !== undefined, 'Event details includes title');
    assert(detailsData.data.location !== undefined, 'Event details includes location');
    assert(detailsData.data.organizer !== undefined, 'Event details includes organizer');
    assert(detailsData.data.userRSVPStatus === null, 'Guest userRSVPStatus is null');

    // 1.5 Public Event Attendees
    const attendeesRes = await fetch(`${baseUrl}/events/${sampleEventId}/attendees`);
    assert(attendeesRes.status === 200, 'Guest GET /api/events/:id/attendees returns 200 OK');
    const attendeesData = await attendeesRes.json();
    assert(attendeesData.success === true, 'Attendees endpoint reports success: true');
    assert(Array.isArray(attendeesData.data.attendees), 'Attendees data contains attendees array');

    // 1.6 Invalid Event ID
    const invalidEventRes = await fetch(`${baseUrl}/events/670000000000000000000999`);
    assert(invalidEventRes.status === 404, 'Guest GET non-existent event ID returns 404 Not Found');

    // -----------------------------------------------------------------
    // SECTION 2: GUEST -> AUTHENTICATION BOUNDARIES & GUARDRAILS
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Guest -> Authentication Boundaries ---');

    // 2.1 Guest RSVP attempts
    const guestRsvpPost = await fetch(`${baseUrl}/events/${sampleEventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(guestRsvpPost.status === 401, 'Guest POST /rsvp returns 401 Unauthorized');

    const guestRsvpDelete = await fetch(`${baseUrl}/events/${sampleEventId}/rsvp`, {
      method: 'DELETE'
    });
    assert(guestRsvpDelete.status === 401, 'Guest DELETE /rsvp returns 401 Unauthorized');

    // 2.2 Guest My Events
    const guestMyEvents = await fetch(`${baseUrl}/events/user/my-events`);
    assert(guestMyEvents.status === 401, 'Guest GET /events/user/my-events returns 401 Unauthorized');

    // 2.3 Guest Create Event
    const guestCreateEvent = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Event',
        description: 'Should not be allowed',
        category: 'Tech',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        location: { address: 'Unauthorized St', city: 'Mumbai', coordinates: [72.8777, 19.0760] }
      })
    });
    assert(guestCreateEvent.status === 401, 'Guest POST /events returns 401 Unauthorized');

    // 2.4 Guest Profile Access
    const guestGetProfile = await fetch(`${baseUrl}/auth/me`);
    assert(guestGetProfile.status === 401, 'Guest GET /api/auth/me returns 401 Unauthorized');

    const guestGetUsersMe = await fetch(`${baseUrl}/users/me`);
    assert(guestGetUsersMe.status === 401, 'Guest GET /api/users/me returns 401 Unauthorized');

    const guestPutProfile = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker' })
    });
    assert(guestPutProfile.status === 401, 'Guest PUT /api/users/me returns 401 Unauthorized');

    // -----------------------------------------------------------------
    // SECTION 3: AUTHENTICATED USER LIFECYCLE & TRANSITIONS
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Authenticated User Lifecycle & Transitions ---');
    const timestamp = Date.now();
    const userAEmail = `user_step9_a_${timestamp}@localvibe.app`;
    const userBEmail = `user_step9_b_${timestamp}@localvibe.app`;

    // 3.1 Register User A
    const regResA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Joshi',
        email: userAEmail,
        password: 'password123',
        role: 'USER',
        bio: 'Avid music & indie film explorer',
        location: { city: 'Mumbai' }
      })
    });
    assert(regResA.status === 201, 'User A registration returns 201 Created');
    const userAData = await regResA.json();
    const tokenA = userAData.data.token;
    const userAId = userAData.data.user.id || userAData.data.user._id;

    // 3.2 Login Transition
    const loginResA = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAEmail,
        password: 'password123'
      })
    });
    assert(loginResA.status === 200, 'User A login returns 200 OK');
    const loginDataA = await loginResA.json();
    assert(loginDataA.data.token !== undefined, 'Login returns JWT token');
    assert(loginDataA.data.user.name === 'Rohan Joshi', 'Login returns sanitized user object');

    // 3.3 Authenticated RSVP Transition
    const authRsvpRes = await fetch(`${baseUrl}/events/${sampleEventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ status: 'GOING' })
    });
    assert(authRsvpRes.status === 200, 'Authenticated User A POST /rsvp succeeds (200 OK)');
    const authRsvpData = await authRsvpRes.json();
    assert(authRsvpData.data.status === 'GOING', 'RSVP record status is GOING');

    // 3.4 Authenticated Event Details contains userRSVPStatus
    const authDetailsRes = await fetch(`${baseUrl}/events/${sampleEventId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(authDetailsRes.status === 200, 'Authenticated GET /api/events/:id returns 200 OK');
    const authDetailsData = await authDetailsRes.json();
    assert(authDetailsData.data.userRSVPStatus === 'GOING', 'Event Details reflects userRSVPStatus === GOING for User A');

    // -----------------------------------------------------------------
    // SECTION 4: PROFILE & ACCOUNT MANAGEMENT
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Profile & Account Management ---');

    // 4.1 Fetch Current Profile (/api/auth/me & /api/users/me)
    const profileMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(profileMeRes.status === 200, 'GET /api/auth/me returns 200 OK');
    const profileMeData = await profileMeRes.json();
    assert(profileMeData.data.email === userAEmail, 'Profile email matches User A');
    assert(profileMeData.data.name === 'Rohan Joshi', 'Profile name matches User A');
    assert(profileMeData.data.bio === 'Avid music & indie film explorer', 'Profile bio matches User A');

    const usersMeRes = await fetch(`${baseUrl}/users/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(usersMeRes.status === 200, 'GET /api/users/me returns 200 OK');
    const usersMeData = await usersMeRes.json();
    assert(usersMeData.data.email === userAEmail, 'GET /api/users/me returns identical user object');

    // 4.2 Edit Profile (Name, Bio, City, ProfileImage)
    const updateProfileRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Rohan V. Joshi',
        bio: 'Updated bio: Hyperlocal enthusiast & vinyl collector',
        location: { city: 'Pune' },
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      })
    });
    assert(updateProfileRes.status === 200, 'PUT /api/users/me returns 200 OK');
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileData.data.name === 'Rohan V. Joshi', 'Profile response has updated name');
    assert(updateProfileData.data.bio === 'Updated bio: Hyperlocal enthusiast & vinyl collector', 'Profile response has updated bio');
    assert(updateProfileData.data.location.city === 'Pune', 'Profile response has updated city');

    // 4.3 Verify Persistence across Session Refresh
    const verifyRefreshRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const verifyRefreshData = await verifyRefreshRes.json();
    assert(verifyRefreshData.data.name === 'Rohan V. Joshi', 'Subsequent GET /api/auth/me retains updated name');
    assert(verifyRefreshData.data.location.city === 'Pune', 'Subsequent GET /api/auth/me retains updated city');

    // -----------------------------------------------------------------
    // SECTION 5: PROFILE SECURITY & GUARDRAILS
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Profile Security & Tampering Prevention ---');

    // 5.1 Role Tampering Attempt (Should be rejected)
    const roleTamperRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        role: 'ADMIN'
      })
    });
    assert(roleTamperRes.status === 400, 'Attempt to modify role via profile update returns 400 Bad Request');
    const roleTamperData = await roleTamperRes.json();
    assert(roleTamperData.success === false, 'Role tampering response reports success: false');

    // 5.2 Password / PasswordHash Tampering Attempt (Should be rejected)
    const passwordTamperRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        password: 'new_hacked_password',
        passwordHash: 'injected_hash'
      })
    });
    assert(passwordTamperRes.status === 400, 'Attempt to modify password via profile update returns 400 Bad Request');

    // 5.3 Validation: Name Too Short
    const invalidNameRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'A'
      })
    });
    assert(invalidNameRes.status === 400, 'Single-character name returns 400 Bad Request');

    // 5.4 Validation: Bio Too Long (> 500 characters)
    const longBio = 'x'.repeat(501);
    const invalidBioRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        bio: longBio
      })
    });
    assert(invalidBioRes.status === 400, 'Bio exceeding 500 characters returns 400 Bad Request');

    // -----------------------------------------------------------------
    // SECTION 6: MULTI-USER ISOLATION & DATA PRIVACY
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Multi-User Isolation & Privacy ---');

    // 6.1 Register User B
    const regResB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Deshmukh',
        email: userBEmail,
        password: 'password123',
        role: 'USER',
        bio: 'Foodie & coffee workshop lover',
        location: { city: 'Bengaluru' }
      })
    });
    assert(regResB.status === 201, 'User B registration returns 201 Created');
    const userBData = await regResB.json();
    const tokenB = userBData.data.token;

    // 6.2 User B fetches own profile
    const profileBRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const profileBData = await profileBRes.json();
    assert(profileBData.data.name === 'Ananya Deshmukh', 'User B sees only User B name');
    assert(profileBData.data.email === userBEmail, 'User B sees only User B email');
    assert(profileBData.data.location.city === 'Bengaluru', 'User B sees only User B city');
    assert(profileBData.data.name !== 'Rohan V. Joshi', 'User A data does not leak to User B');

    // 6.3 User B checks Event Details for sample event
    const eventDetailsB = await fetch(`${baseUrl}/events/${sampleEventId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const eventDetailsBData = await eventDetailsB.json();
    assert(eventDetailsBData.data.userRSVPStatus === null, 'User B has null userRSVPStatus (User A GOING status not leaked)');

    // 6.4 Sensitive Data Check: passwordHash strictly omitted
    assert(profileMeData.data.passwordHash === undefined, 'User A profile excludes passwordHash');
    assert(profileMeData.data.password === undefined, 'User A profile excludes plaintext password');
    assert(profileBData.data.passwordHash === undefined, 'User B profile excludes passwordHash');

    // -----------------------------------------------------------------
    // SECTION 7: TOKEN AUTHENTICATION & ERROR HANDLING
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Token Authentication & Error Handling ---');

    // 7.1 Malformed Token
    const malformedTokenRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': 'Bearer invalid_malformed_token_12345' }
    });
    assert(malformedTokenRes.status === 401, 'Malformed JWT token returns 401 Unauthorized');

    // 7.2 Missing Bearer Prefix
    const noBearerRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': tokenA }
    });
    assert(noBearerRes.status === 401, 'Authorization header missing "Bearer " returns 401 Unauthorized');

    // 7.3 Invalid Login
    const invalidLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAEmail,
        password: 'wrong_password_123'
      })
    });
    assert(invalidLoginRes.status === 401, 'Invalid login password returns 401 Unauthorized');

    console.log('\n====================================================');
    console.log(`STEP 9 GUEST, AUTH & PROFILE AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Step 9 Audit Failed:', error);
    process.exit(1);
  }
};

runStep9GuestAuthProfileTests();
