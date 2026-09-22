const baseUrl = 'http://localhost:5000/api';
const frontendUrl = 'http://localhost:5173';

const runStep1Verification = async () => {
  console.log('====================================================');
  console.log('STARTING LOCALVIBE STEP 1: ROUTING, NAVIGATION & AUTH VERIFICATION');
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
    // 1. Verify Frontend Dev Server & HTML Entry
    console.log('--- 1. Testing Frontend SPA Entry & HTML Root ---');
    const frontendRes = await fetch(frontendUrl);
    assert(frontendRes.status === 200, 'Frontend server responds with 200 OK at root');
    const frontendHtml = await frontendRes.text();
    assert(frontendHtml.includes('<div id="root"></div>'), 'HTML includes React root mounting node');
    assert(frontendHtml.includes('/src/main.jsx'), 'HTML loads main.jsx entry point');

    // 2. Verify Backend API Health Endpoint
    console.log('\n--- 2. Testing Backend Entry & API Routing ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health responds with 200 OK');
    assert(healthData.success === true, 'Health check indicates success: true');

    // 3. Verify Public Routes on Backend for Discovery
    console.log('\n--- 3. Testing Public Routes & Dynamic Event Details ---');
    const eventsRes = await fetch(`${baseUrl}/events?limit=5`);
    const eventsData = await eventsRes.json();
    assert(eventsRes.status === 200, 'GET /api/events (Discover) returns 200 OK');
    assert(Array.isArray(eventsData.data) && eventsData.data.length > 0, 'Public events feed accessible');

    const sampleEvent = eventsData.data[0];
    const sampleEventId = sampleEvent._id;
    const singleEventRes = await fetch(`${baseUrl}/events/${sampleEventId}`);
    const singleEventData = await singleEventRes.json();
    assert(singleEventRes.status === 200, 'GET /api/events/:id returns 200 OK');
    assert(singleEventData.data.title === sampleEvent.title, 'Event details match expected title');

    // 4. Test Authentication Entry Lifecycle
    console.log('\n--- 4. Testing Authentication Lifecycle (Register -> Login -> Auth State) ---');
    const testTimestamp = Date.now();
    const testEmail = `step1_user_${testTimestamp}@localvibe.app`;
    const testPassword = 'Password123!';

    // 4.1 Register New User
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step 1 Tester',
        email: testEmail,
        password: testPassword,
        role: 'USER'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regData.data.token && typeof regData.data.token === 'string', 'Registration returns JWT token string');
    assert(regData.data.user.email === testEmail, 'Returned user object contains registered email');
    const userToken = regData.data.token;

    // 4.2 Login With Credentials
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
    assert(loginData.data.token && typeof loginData.data.token === 'string', 'Login returns JWT token string');
    assert(loginData.data.user.email === testEmail, 'Login response contains matching user object');

    // 5. Test Session Persistence (/api/auth/me)
    console.log('\n--- 5. Testing Session Persistence & Token Verification ---');
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    };
    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me with Bearer token returns 200 OK');
    const fetchedUser = meData.data?.user || meData.data;
    assert(fetchedUser.email === testEmail, 'Verified session user matches authenticated email');
    assert(fetchedUser.passwordHash === undefined, 'Sensitive passwordHash is NEVER exposed in profile API');

    // 6. Test Protected Route Guardrails
    console.log('\n--- 6. Testing Protected Route Security & Guardrails ---');
    
    // 6.1 Protected Route Without Token
    const unauthEventCreateRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Event' })
    });
    assert(unauthEventCreateRes.status === 401, 'POST /api/events without token is blocked with 401 Unauthorized');

    const unauthMyEventsRes = await fetch(`${baseUrl}/events/user/my-events`);
    assert(unauthMyEventsRes.status === 401, 'GET /api/events/user/my-events without token is blocked with 401 Unauthorized');

    const unauthProfileRes = await fetch(`${baseUrl}/users/me`);
    assert(unauthProfileRes.status === 401, 'GET /api/users/me without token is blocked with 401 Unauthorized');

    // 6.2 Protected Route With Valid Token
    const authMyEventsRes = await fetch(`${baseUrl}/events/user/my-events`, { headers: authHeaders });
    assert(authMyEventsRes.status === 200, 'GET /api/events/user/my-events with valid token returns 200 OK');

    const authProfileRes = await fetch(`${baseUrl}/users/me`, { headers: authHeaders });
    assert(authProfileRes.status === 200, 'GET /api/users/me with valid token returns 200 OK');

    // 7. Test Admin Role Guardrail
    console.log('\n--- 7. Testing Admin Role Authorization Guardrail ---');
    const adminEmail = `admin_tester_${testTimestamp}@localvibe.app`;
    const adminUserRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Attempt',
        email: adminEmail,
        password: testPassword,
        role: 'ADMIN' // Malicious attempt to register directly as ADMIN
      })
    });
    assert(adminUserRes.status === 400, 'Self-registering as ADMIN is strictly rejected with 400 Bad Request');

    // 8. Test Invalid / Tampered Token Rejection
    console.log('\n--- 8. Testing Tampered & Malformed Token Rejection ---');
    const tamperedRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.fake_signature' }
    });
    assert(tamperedRes.status === 401, 'Tampered token is rejected with 401 Unauthorized');

    console.log('\n====================================================');
    console.log(`STEP 1 ROUTING, NAVIGATION & AUTH VERIFICATION: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Step 1 Verification Failed:', err);
    process.exit(1);
  }
};

runStep1Verification();
