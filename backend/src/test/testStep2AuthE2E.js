const baseUrl = 'http://localhost:5000/api';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const runAuthE2ETests = async () => {
  console.log('====================================================');
  console.log('LOCALVIBE STEP 2: COMPLETE AUTHENTICATION E2E AUDIT');
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

  const timestamp = Date.now();
  const testUserEmail = `step2_user_${timestamp}@localvibe.app`;
  const testUserPassword = 'SecurePassword123!';
  let userToken = null;
  let userId = null;

  try {
    // -----------------------------------------------------------------
    // SECTION 1: REGISTRATION INPUT VALIDATION & SECURITY
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Registration Input Validation & Guardrails ---');

    // 1.1 Short Name Validation (< 2 characters)
    const shortNameRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: `short_name_${timestamp}@test.com`,
        password: testUserPassword
      })
    });
    assert(shortNameRes.status === 400, 'Registration rejects name shorter than 2 characters (400 Bad Request)');
    const shortNameData = await shortNameRes.json();
    assert(shortNameData.errors.some(e => e.toLowerCase().includes('name')), 'Error message explains name length requirement');

    // 1.2 Invalid Email Format
    const badEmailRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Name',
        email: 'not-a-valid-email-format',
        password: testUserPassword
      })
    });
    assert(badEmailRes.status === 400, 'Registration rejects invalid email format (400 Bad Request)');

    // 1.3 Short Password (< 6 characters)
    const shortPassRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Name',
        email: `short_pass_${timestamp}@test.com`,
        password: '123'
      })
    });
    assert(shortPassRes.status === 400, 'Registration rejects password shorter than 6 characters (400 Bad Request)');

    // 1.4 Security: Admin Self-Registration Prevention
    const adminSelfRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Attacker',
        email: `hacker_${timestamp}@test.com`,
        password: testUserPassword,
        role: 'ADMIN'
      })
    });
    assert(adminSelfRegRes.status === 400, 'Security: Self-registering as ADMIN is strictly blocked (400 Bad Request)');

    // 1.5 Successful Registration with Valid Payload
    console.log('\n--- 2. Testing Successful User Registration & Response Sanitization ---');
    const validRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step 2 Verified User',
        email: testUserEmail,
        password: testUserPassword,
        role: 'USER',
        bio: 'Passionate music explorer and foodie.'
      })
    });
    assert(validRegRes.status === 201, 'Valid registration creates user account (201 Created)');
    const validRegData = await validRegRes.json();
    assert(validRegData.success === true, 'Response reports success: true');
    assert(typeof validRegData.data.token === 'string', 'Registration returns JWT auth token string');
    assert(validRegData.data.user.email === testUserEmail, 'User email matches registered input');
    assert(validRegData.data.user.role === 'USER', 'Default user role is assigned as USER');
    assert(validRegData.data.user.passwordHash === undefined, 'Security: passwordHash is NEVER exposed in registration response');
    assert(validRegData.data.user.password === undefined, 'Security: plaintext password is NEVER returned in response');
    
    userToken = validRegData.data.token;
    userId = validRegData.data.user.id || validRegData.data.user._id;

    // 1.6 Duplicate Email Rejection (409 Conflict)
    console.log('\n--- 3. Testing Duplicate Account Handling ---');
    const duplicateRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Name',
        email: testUserEmail, // same email
        password: 'AnotherPassword123!'
      })
    });
    assert(duplicateRegRes.status === 409 || duplicateRegRes.status === 400, 'Duplicate email registration is rejected with Conflict / Bad Request');

    // -----------------------------------------------------------------
    // SECTION 2: LOGIN CREDENTIAL VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Login Credential Verification & Edge Cases ---');

    // 2.1 Non-existent Email
    const wrongEmailRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `non_existent_${timestamp}@localvibe.app`,
        password: testUserPassword
      })
    });
    assert(wrongEmailRes.status === 401, 'Login with non-existent email returns 401 Unauthorized');
    const wrongEmailData = await wrongEmailRes.json();
    assert(wrongEmailData.message.toLowerCase().includes('invalid'), 'Generic message "Invalid email or password" prevents user enumeration');

    // 2.2 Wrong Password
    const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'CompletelyWrongPassword999!'
      })
    });
    assert(wrongPassRes.status === 401, 'Login with incorrect password returns 401 Unauthorized');

    // 2.3 Missing Credentials
    const missingCredsRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' })
    });
    assert(missingCredsRes.status === 400, 'Login with empty credentials returns 400 Bad Request');

    // 2.4 Successful Login
    const validLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword
      })
    });
    assert(validLoginRes.status === 200, 'Login with valid credentials returns 200 OK');
    const validLoginData = await validLoginRes.json();
    assert(validLoginData.data.token && typeof validLoginData.data.token === 'string', 'Login returns valid JWT token string');
    assert(validLoginData.data.user.email === testUserEmail, 'Login user payload matches authenticated email');
    assert(validLoginData.data.user.passwordHash === undefined, 'Security: passwordHash is NEVER exposed in login response');

    // -----------------------------------------------------------------
    // SECTION 3: JWT STRUCTURE & VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing JWT Token Structure, Claims & Tampering ---');
    const tokenParts = userToken.split('.');
    assert(tokenParts.length === 3, 'JWT structure contains 3 base64 encoded parts (header.payload.signature)');

    // Decode payload claims
    const decodedPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
    assert(decodedPayload.id === userId, 'JWT payload claim contains correct user ID');
    assert(decodedPayload.email === testUserEmail, 'JWT payload claim contains user email');
    assert(decodedPayload.role === 'USER', 'JWT payload claim contains user role');
    assert(typeof decodedPayload.exp === 'number', 'JWT payload contains standard expiration claim (exp)');

    // Tampered Token Rejection
    const tamperedToken = userToken.slice(0, -5) + 'abcde';
    const tamperedAuthRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tamperedToken}` }
    });
    assert(tamperedAuthRes.status === 401, 'Tampered JWT signature is strictly rejected with 401 Unauthorized');

    // Missing Bearer Prefix Rejection
    const noBearerRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': userToken }
    });
    assert(noBearerRes.status === 401, 'Authorization header without "Bearer " prefix is rejected (401 Unauthorized)');

    // -----------------------------------------------------------------
    // SECTION 4: AUTH CONTEXT & SESSION RESTORATION (/auth/me)
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Session Restoration & Profile Retrieval ---');
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    };

    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders });
    assert(meRes.status === 200, 'GET /api/auth/me with valid Bearer token returns 200 OK');
    const meData = await meRes.json();
    const activeUser = meData.data?.user || meData.data;
    assert(activeUser.name === 'Step 2 Verified User', 'Session user name matches database record');
    assert(activeUser.email === testUserEmail, 'Session user email matches database record');
    assert(activeUser.bio === 'Passionate music explorer and foodie.', 'Session user bio matches database record');
    assert(activeUser.passwordHash === undefined, 'Security: passwordHash is NEVER exposed in /auth/me');

    // -----------------------------------------------------------------
    // SECTION 5: PROTECTED ROUTES & ROLE GUARDRAILS
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Protected Route Security & Privilege Escalation Prevention ---');

    // 5.1 Unauthenticated Access Blocked
    const unauthEventsRes = await fetch(`${baseUrl}/events/user/my-events`);
    assert(unauthEventsRes.status === 401, 'GET /api/events/user/my-events without token returns 401');

    const unauthProfileRes = await fetch(`${baseUrl}/users/me`);
    assert(unauthProfileRes.status === 401, 'GET /api/users/me without token returns 401');

    // 5.2 Authenticated User Access Granted
    const authMyEventsRes = await fetch(`${baseUrl}/events/user/my-events`, { headers: authHeaders });
    assert(authMyEventsRes.status === 200, 'GET /api/events/user/my-events with valid token returns 200 OK');

    // 5.3 Privilege Escalation Attempt (Modifying Role via Profile Update)
    const roleTamperRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ role: 'ADMIN' })
    });
    assert(roleTamperRes.status === 400, 'Security: Attempt to escalate role to ADMIN via profile update returns 400 Bad Request');

    // 5.4 Password Tampering Attempt via Profile Update
    const passTamperRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ password: 'HackedPassword999!' })
    });
    assert(passTamperRes.status === 400, 'Security: Attempt to modify password via profile update returns 400 Bad Request');

    // 5.5 Legitimate Profile Update
    const validUpdateRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Step 2 Verified User (Updated)',
        bio: 'Updated bio for LocalVibe community.'
      })
    });
    assert(validUpdateRes.status === 200, 'Legitimate profile update succeeds (200 OK)');
    const updateData = await validUpdateRes.json();
    const updatedUser = updateData.data?.user || updateData.data;
    assert(updatedUser.name === 'Step 2 Verified User (Updated)', 'Updated name reflected in response');
    assert(updatedUser.bio === 'Updated bio for LocalVibe community.', 'Updated bio reflected in response');

    // -----------------------------------------------------------------
    // SECTION 6: LOGOUT SESSION CLEARANCE SIMULATION
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testing Logout & Client Session Clearance Simulation ---');
    // When client logs out, token is removed from localStorage
    // Outbound requests without token are rejected
    const loggedOutReq = await fetch(`${baseUrl}/users/me`, {
      headers: { 'Content-Type': 'application/json' } // No token
    });
    assert(loggedOutReq.status === 401, 'Logged out request without token is rejected with 401');

    console.log('\n====================================================');
    console.log(`STEP 2 AUTHENTICATION E2E AUDIT: ${passed}/${total} TESTS PASSED!`);
    console.log('====================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Step 2 Auth E2E Audit Failed:', err);
    process.exit(1);
  }
};

runAuthE2ETests();
